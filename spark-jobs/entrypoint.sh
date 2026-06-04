#!/bin/bash
set -e
echo "Starting TransactionFlow Spark Streaming Job..."
exec /opt/bitnami/spark/bin/spark-submit \
  --master "${SPARK_MASTER_URL:-local[2]}" \
  --driver-memory 1g \
  --executor-memory 1g \
  --conf spark.sql.adaptive.enabled=true \
  --conf spark.hadoop.fs.defaultFS=hdfs://hdfs-namenode:9000 \
  --conf spark.sql.streaming.checkpointLocation="${HDFS_CHECKPOINT_PATH:-hdfs://hdfs-namenode:9000/data/transactionflow/checkpoints}" \
  --class com.acido303.transactionflow.spark.TransactionFlowStreamingJob \
  /app/spark-job.jar
