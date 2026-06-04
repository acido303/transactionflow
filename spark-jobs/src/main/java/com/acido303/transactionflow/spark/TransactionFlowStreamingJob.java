package com.acido303.transactionflow.spark;

import org.apache.spark.sql.*;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructType;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Properties;
import java.util.Set;

import static org.apache.spark.sql.functions.*;
import static org.apache.spark.sql.RowFactory.create;

/**
 * TransactionFlow Spark Structured Streaming Job.
 *
 * <p>Reads raw transaction JSON from Kafka, validates and normalises records,
 * writes valid records to HDFS as Parquet, rejected records to HDFS as JSON,
 * and stores aggregations plus high-value / recent transactions in PostgreSQL.
 */
public class TransactionFlowStreamingJob {

    // ── Allowed values ────────────────────────────────────────────────────────

    private static final Set<String> VALID_TRANSACTION_TYPES = new HashSet<>(Arrays.asList(
            "CARD_PAYMENT", "CASH_WITHDRAWAL", "BANK_TRANSFER",
            "DIRECT_DEBIT", "REFUND", "UNKNOWN"
    ));

    private static final Set<String> VALID_CURRENCIES = new HashSet<>(Arrays.asList(
            "EUR", "GBP", "USD"
    ));

    // ── PostgreSQL table names ─────────────────────────────────────────────────

    private static final String TABLE_METRICS_CURRENCY = "transaction_metrics_by_currency";
    private static final String TABLE_METRICS_TYPE     = "transaction_metrics_by_type";
    private static final String TABLE_METRICS_COUNTRY  = "transaction_metrics_by_country";
    private static final String TABLE_HIGH_VALUE       = "high_value_transactions";
    private static final String TABLE_RECENT           = "recent_transactions";
    private static final String TABLE_JOB_METRICS      = "spark_job_metrics";

    // ─────────────────────────────────────────────────────────────────────────

    public static void main(String[] args) throws Exception {

        // ── Read configuration from environment variables ─────────────────────
        String kafkaBootstrapServers = env("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092");
        String kafkaTopicRaw         = env("KAFKA_TOPIC_RAW",         "transactions.raw");
        String hdfsRawPath           = env("HDFS_RAW_PATH",           "hdfs://hdfs-namenode:9000/data/transactionflow/raw/transactions");
        String hdfsRejectedPath      = env("HDFS_REJECTED_PATH",      "hdfs://hdfs-namenode:9000/data/transactionflow/rejected/transactions");
        String hdfsCheckpointPath    = env("HDFS_CHECKPOINT_PATH",    "hdfs://hdfs-namenode:9000/data/transactionflow/checkpoints");
        String postgresUrl           = env("POSTGRES_URL",            "jdbc:postgresql://postgres:5432/transactionflow");
        String postgresUser          = env("POSTGRES_USER",           "transactionflow");
        String postgresPassword      = env("POSTGRES_PASSWORD",       "transactionflow");
        double highValueThreshold    = Double.parseDouble(env("HIGH_VALUE_THRESHOLD", "10000"));

        System.out.println("=================================================");
        System.out.println("TransactionFlow Spark Streaming Job starting up");
        System.out.println("=================================================");
        System.out.println("Kafka brokers  : " + kafkaBootstrapServers);
        System.out.println("Kafka topic    : " + kafkaTopicRaw);
        System.out.println("HDFS raw path  : " + hdfsRawPath);
        System.out.println("HDFS rejected  : " + hdfsRejectedPath);
        System.out.println("HDFS checkpoint: " + hdfsCheckpointPath);
        System.out.println("Postgres URL   : " + postgresUrl);
        System.out.println("Postgres user  : " + postgresUser);
        System.out.println("High-value thr : " + highValueThreshold);
        System.out.println("=================================================");

        // ── Wait for Kafka to be available ────────────────────────────────────
        waitForKafka(kafkaBootstrapServers);

        // ── Create Spark session ──────────────────────────────────────────────
        SparkSession spark = SparkSession.builder()
                .appName("TransactionFlowStreaming")
                .config("spark.sql.shuffle.partitions", "4")
                .config("spark.hadoop.fs.defaultFS", "hdfs://hdfs-namenode:9000")
                .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
                .getOrCreate();

        spark.sparkContext().setLogLevel("WARN");

        // ── Define the expected JSON schema ───────────────────────────────────
        StructType transactionSchema = new StructType()
                .add("transactionId",          DataTypes.StringType, true)
                .add("accountId",              DataTypes.StringType, true)
                .add("customerId",             DataTypes.StringType, true)
                .add("transactionType",        DataTypes.StringType, true)
                .add("originalTransactionType", DataTypes.StringType, true)
                .add("amount",                 DataTypes.DoubleType, true)
                .add("currency",               DataTypes.StringType, true)
                .add("merchant",               DataTypes.StringType, true)
                .add("countryCode",            DataTypes.StringType, true)
                .add("countryName",            DataTypes.StringType, true)
                .add("createdAt",              DataTypes.StringType, true);

        // ── Read from Kafka ───────────────────────────────────────────────────
        Dataset<Row> rawStream = spark.readStream()
                .format("kafka")
                .option("kafka.bootstrap.servers", kafkaBootstrapServers)
                .option("subscribe", kafkaTopicRaw)
                .option("startingOffsets", "latest")
                .option("failOnDataLoss", "false")
                .load();

        // ── Parse JSON payloads ───────────────────────────────────────────────
        Dataset<Row> parsed = rawStream
                .selectExpr("CAST(value AS STRING) as json_str", "timestamp as kafka_ts")
                .select(
                        from_json(col("json_str"), transactionSchema).as("data"),
                        col("kafka_ts")
                )
                .select("data.*", "kafka_ts");

        // ── JDBC properties (reused by every batch write) ─────────────────────
        Properties jdbcProps = new Properties();
        jdbcProps.setProperty("user",   postgresUser);
        jdbcProps.setProperty("password", postgresPassword);
        jdbcProps.setProperty("driver", "org.postgresql.Driver");

        // ── Start the main foreachBatch streaming query ───────────────────────
        // start() registers the query with spark.streams(); we use awaitAnyTermination below.
        parsed.writeStream()
                .queryName("main-transaction-processor")
                .option("checkpointLocation", hdfsCheckpointPath + "/main")
                .foreachBatch((batchDf, batchId) ->
                        processBatch(batchDf, batchId,
                                hdfsRawPath, hdfsRejectedPath,
                                postgresUrl, jdbcProps,
                                highValueThreshold, spark))
                .start();

        System.out.println("Streaming query started. Awaiting termination...");
        spark.streams().awaitAnyTermination();
    }

    // ─── Batch processor ──────────────────────────────────────────────────────

    private static void processBatch(
            Dataset<Row> batchDf,
            long batchId,
            String hdfsRawPath,
            String hdfsRejectedPath,
            String postgresUrl,
            Properties jdbcProps,
            double highValueThreshold,
            SparkSession spark) {

        long batchStartMs = System.currentTimeMillis();

        // Cache the batch to avoid recomputation across the multiple sinks
        batchDf.cache();

        long totalCount = batchDf.count();
        if (totalCount == 0) {
            System.out.println("Batch " + batchId + ": empty, skipping.");
            batchDf.unpersist();
            return;
        }
        System.out.println("Batch " + batchId + ": processing " + totalCount + " records.");

        // ── 1. Add date partition columns ─────────────────────────────────────
        Dataset<Row> withPartitions = batchDf
                .withColumn("year",  substring(col("createdAt"), 1, 4))
                .withColumn("month", substring(col("createdAt"), 6, 2))
                .withColumn("day",   substring(col("createdAt"), 9, 2));

        // ── 2. Normalise transaction types ────────────────────────────────────
        // If transactionType is not in the allowed set → set it to UNKNOWN
        // and preserve the original value in originalTransactionType.
        Dataset<Row> normalised = normaliseTransactionTypes(withPartitions);
        normalised.cache();

        // ── 3. Split into valid and rejected ──────────────────────────────────
        Column isValidCurrency = col("currency").isin(VALID_CURRENCIES.toArray());

        Column isRejected = col("transactionId").isNull()
                .or(col("transactionId").equalTo(""))
                .or(col("accountId").isNull())
                .or(col("accountId").equalTo(""))
                .or(col("customerId").isNull())
                .or(col("customerId").equalTo(""))
                .or(col("amount").isNull())
                .or(col("amount").leq(0))
                .or(col("currency").isNull())
                .or(isValidCurrency.equalTo(false))
                .or(col("countryCode").isNull())
                .or(col("countryCode").equalTo(""))
                .or(col("createdAt").isNull())
                .or(col("createdAt").equalTo(""));

        Dataset<Row> valid    = normalised.filter(isRejected.equalTo(false));
        Dataset<Row> rejected = normalised.filter(isRejected);

        valid.cache();
        rejected.cache();

        long validCount    = valid.count();
        long rejectedCount = rejected.count();

        System.out.println("Batch " + batchId + ": valid=" + validCount + " rejected=" + rejectedCount);

        // ── 4. Write valid records to HDFS Parquet ────────────────────────────
        long rawFilesWritten = 0;
        try {
            if (validCount > 0) {
                valid.write()
                        .mode("append")
                        .partitionBy("year", "month", "day")
                        .parquet(hdfsRawPath);
                rawFilesWritten = 1;
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing valid records to HDFS: " + e.getMessage());
        }

        // ── 5. Write rejected records to HDFS JSON ────────────────────────────
        long rejectedFilesWritten = 0;
        try {
            if (rejectedCount > 0) {
                Dataset<Row> rejectedEnriched = buildRejectedDataset(rejected);
                rejectedEnriched.write()
                        .mode("append")
                        .json(hdfsRejectedPath);
                rejectedFilesWritten = 1;
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing rejected records to HDFS: " + e.getMessage());
        }

        // ── 6. Windowed aggregations ──────────────────────────────────────────
        // We use the current batch as the "window" (batchDf does not carry
        // watermarked event-time in foreachBatch, so we aggregate over the batch
        // and use NOW() as the window boundaries).
        Timestamp windowStart = Timestamp.from(Instant.now().minusSeconds(60));
        Timestamp windowEnd   = Timestamp.from(Instant.now());

        // 6a. Metrics by currency
        try {
            if (validCount > 0) {
                Dataset<Row> metricsCurrency = valid
                        .groupBy("currency")
                        .agg(
                                count("*").as("transaction_count"),
                                sum("amount").as("total_amount"),
                                avg("amount").as("average_amount")
                        )
                        .withColumn("window_start", lit(windowStart.toString()).cast("timestamp"))
                        .withColumn("window_end",   lit(windowEnd.toString()).cast("timestamp"))
                        .select("window_start", "window_end", "currency",
                                "transaction_count", "total_amount", "average_amount");

                metricsCurrency.write()
                        .mode("append")
                        .jdbc(postgresUrl, TABLE_METRICS_CURRENCY, jdbcProps);
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing currency metrics: " + e.getMessage());
        }

        // 6b. Metrics by transaction type
        try {
            if (validCount > 0) {
                Dataset<Row> metricsType = valid
                        .groupBy("transactionType")
                        .agg(
                                count("*").as("transaction_count"),
                                sum("amount").as("total_amount")
                        )
                        .withColumn("window_start", lit(windowStart.toString()).cast("timestamp"))
                        .withColumn("window_end",   lit(windowEnd.toString()).cast("timestamp"))
                        .withColumnRenamed("transactionType", "transaction_type")
                        .select("window_start", "window_end", "transaction_type",
                                "transaction_count", "total_amount");

                metricsType.write()
                        .mode("append")
                        .jdbc(postgresUrl, TABLE_METRICS_TYPE, jdbcProps);
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing type metrics: " + e.getMessage());
        }

        // 6c. Metrics by country
        try {
            if (validCount > 0) {
                // Count high-value transactions per country in this batch
                Dataset<Row> highValuePerCountry = valid
                        .filter(col("amount").geq(highValueThreshold))
                        .groupBy("countryCode")
                        .agg(count("*").as("high_value_count_per_cc"));

                Dataset<Row> metricsCountry = valid
                        .groupBy("countryCode", "countryName")
                        .agg(
                                count("*").as("transaction_count"),
                                sum("amount").as("total_amount"),
                                avg("amount").as("average_amount"),
                                max("createdAt").as("last_transaction_at_str")
                        )
                        .join(highValuePerCountry, Arrays.asList("countryCode"), "left")
                        .withColumn("high_value_count",
                                when(col("high_value_count_per_cc").isNull(), lit(0L))
                                        .otherwise(col("high_value_count_per_cc")))
                        .withColumn("rejected_count", lit(0L))
                        .withColumn("window_start", lit(windowStart.toString()).cast("timestamp"))
                        .withColumn("window_end",   lit(windowEnd.toString()).cast("timestamp"))
                        .withColumn("last_transaction_at",
                                col("last_transaction_at_str").cast("timestamp"))
                        .withColumnRenamed("countryCode", "country_code")
                        .withColumnRenamed("countryName", "country_name")
                        .select("window_start", "window_end", "country_code", "country_name",
                                "transaction_count", "total_amount", "average_amount",
                                "high_value_count", "rejected_count", "last_transaction_at");

                metricsCountry.write()
                        .mode("append")
                        .jdbc(postgresUrl, TABLE_METRICS_COUNTRY, jdbcProps);
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing country metrics: " + e.getMessage());
        }

        // ── 7. High-value transactions ────────────────────────────────────────
        try {
            Dataset<Row> highValue = valid
                    .filter(col("amount").geq(highValueThreshold))
                    .withColumn("detected_at", lit(windowEnd.toString()).cast("timestamp"))
                    .withColumnRenamed("transactionId",    "transaction_id")
                    .withColumnRenamed("accountId",        "account_id")
                    .withColumnRenamed("customerId",       "customer_id")
                    .withColumnRenamed("transactionType",  "transaction_type")
                    .withColumnRenamed("countryCode",      "country_code")
                    .withColumnRenamed("countryName",      "country_name")
                    .withColumn("created_at", col("createdAt").cast("timestamp"))
                    .select("transaction_id", "account_id", "customer_id",
                            "amount", "currency", "transaction_type",
                            "merchant", "country_code", "country_name",
                            "created_at", "detected_at");

            if (!highValue.isEmpty()) {
                // Use append; the table has a PRIMARY KEY on transaction_id so
                // duplicates within a batch would fail.  We de-duplicate first.
                highValue.dropDuplicates("transaction_id")
                        .write()
                        .mode("append")
                        .jdbc(postgresUrl, TABLE_HIGH_VALUE, jdbcProps);
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing high-value transactions: " + e.getMessage());
        }

        // ── 8. Recent transactions (valid + rejected, capped by latest 100) ────
        try {
            Timestamp processedAt = Timestamp.from(Instant.now());

            // Valid records
            Dataset<Row> recentValid = valid
                    .withColumn("status",
                            when(col("amount").geq(highValueThreshold), lit("HIGH_VALUE"))
                                    .otherwise(lit("VALID")))
                    .withColumn("rejection_reason", lit(null).cast("string"))
                    .withColumn("processed_at", lit(processedAt.toString()).cast("timestamp"))
                    .withColumn("created_at_ts", col("createdAt").cast("timestamp"))
                    .withColumnRenamed("transactionId",   "transaction_id")
                    .withColumnRenamed("accountId",       "account_id")
                    .withColumnRenamed("customerId",      "customer_id")
                    .withColumnRenamed("transactionType", "transaction_type")
                    .withColumnRenamed("countryCode",     "country_code")
                    .withColumnRenamed("countryName",     "country_name")
                    .select("transaction_id", "account_id", "customer_id",
                            "transaction_type", "amount", "currency",
                            "merchant", "country_code", "country_name",
                            "status", "rejection_reason",
                            col("created_at_ts").as("created_at"), "processed_at");

            // Rejected records
            Dataset<Row> recentRejected = rejected
                    .withColumn("status", lit("REJECTED"))
                    .withColumn("rejection_reason", buildRejectionReasonColumn())
                    .withColumn("processed_at", lit(processedAt.toString()).cast("timestamp"))
                    .withColumn("created_at_ts", col("createdAt").cast("timestamp"))
                    .withColumn("transaction_id_safe",
                            when(col("transactionId").isNull(), lit("UNKNOWN-" + batchId))
                                    .otherwise(col("transactionId")))
                    .withColumn("account_id_safe",
                            when(col("accountId").isNull(), lit("UNKNOWN"))
                                    .otherwise(col("accountId")))
                    .withColumn("customer_id_safe",
                            when(col("customerId").isNull(), lit("UNKNOWN"))
                                    .otherwise(col("customerId")))
                    .withColumn("type_safe",
                            when(col("transactionType").isNull(), lit("UNKNOWN"))
                                    .otherwise(col("transactionType")))
                    .withColumn("amount_safe",
                            when(col("amount").isNull(), lit(0.0))
                                    .otherwise(col("amount")))
                    .withColumn("currency_safe",
                            when(col("currency").isNull(), lit("N/A"))
                                    .otherwise(col("currency")))
                    .withColumn("country_code_safe",
                            when(col("countryCode").isNull(), lit("N/A"))
                                    .otherwise(col("countryCode")))
                    .withColumn("country_name_safe",
                            when(col("countryName").isNull(), lit("N/A"))
                                    .otherwise(col("countryName")))
                    .select(
                            col("transaction_id_safe").as("transaction_id"),
                            col("account_id_safe").as("account_id"),
                            col("customer_id_safe").as("customer_id"),
                            col("type_safe").as("transaction_type"),
                            col("amount_safe").as("amount"),
                            col("currency_safe").as("currency"),
                            col("merchant"),
                            col("country_code_safe").as("country_code"),
                            col("country_name_safe").as("country_name"),
                            col("status"),
                            col("rejection_reason"),
                            col("created_at_ts").as("created_at"),
                            col("processed_at"));

            Dataset<Row> recentAll = recentValid.union(recentRejected)
                    .orderBy(col("created_at").desc())
                    .limit(100)
                    .dropDuplicates("transaction_id");

            if (!recentAll.isEmpty()) {
                recentAll.write()
                        .mode("append")
                        .jdbc(postgresUrl, TABLE_RECENT, jdbcProps);
            }
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing recent transactions: " + e.getMessage());
        }

        // ── 9. Spark job metrics ───────────────────────────────────────────────
        long batchDurationMs = System.currentTimeMillis() - batchStartMs;
        try {
            double rowsPerSecond = batchDurationMs > 0
                    ? (totalCount * 1000.0) / batchDurationMs
                    : 0.0;

            Timestamp recordedAt = Timestamp.from(Instant.now());
            Dataset<Row> metricsRow = spark.createDataFrame(
                    Collections.singletonList(
                            create(
                                    batchId,
                                    validCount,
                                    rejectedCount,
                                    rowsPerSecond,
                                    batchDurationMs,
                                    rawFilesWritten,
                                    rejectedFilesWritten,
                                    recordedAt
                            )
                    ),
                    new StructType()
                            .add("batch_id",               DataTypes.LongType,   false)
                            .add("processed_messages",     DataTypes.LongType,   false)
                            .add("rejected_messages",      DataTypes.LongType,   false)
                            .add("rows_per_second",        DataTypes.DoubleType, false)
                            .add("batch_duration_ms",      DataTypes.LongType,   false)
                            .add("raw_files_written",      DataTypes.LongType,   false)
                            .add("rejected_files_written", DataTypes.LongType,   false)
                            .add("recorded_at",            DataTypes.TimestampType, false)
            );

            metricsRow.write()
                    .mode("append")
                    .jdbc(postgresUrl, TABLE_JOB_METRICS, jdbcProps);
        } catch (Exception e) {
            System.err.println("Batch " + batchId + ": ERROR writing job metrics: " + e.getMessage());
        }

        // ── Cleanup ───────────────────────────────────────────────────────────
        rejected.unpersist();
        valid.unpersist();
        normalised.unpersist();
        batchDf.unpersist();

        System.out.println("Batch " + batchId + ": completed in " + batchDurationMs + " ms.");
    }

    // ─── Helper: normalise transaction types ───────────────────────────────────

    /**
     * For rows whose transactionType is not in the allowed set, set
     * transactionType = UNKNOWN and preserve the original value in
     * originalTransactionType (only when it was not already set).
     */
    private static Dataset<Row> normaliseTransactionTypes(Dataset<Row> df) {
        Object[] allowedTypes = VALID_TRANSACTION_TYPES.toArray();

        return df
                .withColumn("originalTransactionType",
                        when(
                                col("transactionType").isin(allowedTypes).equalTo(false)
                                        .and(col("transactionType").isNotNull()),
                                col("transactionType")
                        ).otherwise(col("originalTransactionType"))
                )
                .withColumn("transactionType",
                        when(col("transactionType").isin(allowedTypes), col("transactionType"))
                                .otherwise(lit("UNKNOWN"))
                );
    }

    // ─── Helper: build rejection-reason column ────────────────────────────────

    private static Column buildRejectionReasonColumn() {
        Object[] validCurrencies = VALID_CURRENCIES.toArray();
        return when(col("transactionId").isNull().or(col("transactionId").equalTo("")),
                        lit("Missing transactionId"))
                .when(col("accountId").isNull().or(col("accountId").equalTo("")),
                        lit("Missing accountId"))
                .when(col("customerId").isNull().or(col("customerId").equalTo("")),
                        lit("Missing customerId"))
                .when(col("amount").isNull().or(col("amount").leq(0)),
                        lit("Invalid amount"))
                .when(col("currency").isNull().or(col("currency").isin(validCurrencies).equalTo(false)),
                        lit("Invalid or unsupported currency"))
                .when(col("countryCode").isNull().or(col("countryCode").equalTo("")),
                        lit("Missing countryCode"))
                .when(col("createdAt").isNull().or(col("createdAt").equalTo("")),
                        lit("Missing createdAt"))
                .otherwise(lit("Validation failed"));
    }

    // ─── Helper: enrich rejected rows with metadata ────────────────────────────

    private static Dataset<Row> buildRejectedDataset(Dataset<Row> rejected) {
        Timestamp ingestedAt = Timestamp.from(Instant.now());
        return rejected
                .withColumn("rejectionReason", buildRejectionReasonColumn())
                .withColumn("originalPayload",
                        to_json(struct(col("transactionId"), col("accountId"),
                                col("customerId"), col("transactionType"),
                                col("amount"), col("currency"),
                                col("merchant"), col("countryCode"),
                                col("countryName"), col("createdAt"))))
                .withColumn("ingestedAt", lit(ingestedAt.toString()).cast("timestamp"));
    }

    // ─── Helper: wait for Kafka ────────────────────────────────────────────────

    private static void waitForKafka(String bootstrapServers) {
        System.out.println("Waiting for Kafka to be available at " + bootstrapServers + " ...");
        int maxAttempts = 30;
        int attempt     = 0;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                // Parse host:port from the bootstrap-servers string (first entry)
                String firstServer = bootstrapServers.split(",")[0].trim();
                String host = firstServer.split(":")[0];
                int    port = Integer.parseInt(firstServer.split(":")[1]);

                try (java.net.Socket socket = new java.net.Socket()) {
                    socket.connect(new java.net.InetSocketAddress(host, port), 3000);
                }
                System.out.println("Kafka is reachable (attempt " + attempt + ").");
                return;
            } catch (Exception e) {
                System.out.println("Kafka not yet available (attempt " + attempt + "/" + maxAttempts
                        + "): " + e.getMessage() + ". Retrying in 5 s...");
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        System.err.println("WARNING: Kafka was not reachable after " + maxAttempts + " attempts. Proceeding anyway.");
    }

    // ─── Helper: read env var with default ────────────────────────────────────

    private static String env(String name, String defaultValue) {
        String value = System.getenv(name);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
}
