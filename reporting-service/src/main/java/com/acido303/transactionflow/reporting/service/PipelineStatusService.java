package com.acido303.transactionflow.reporting.service;

import com.acido303.transactionflow.reporting.dto.PipelineFlowResponse;
import com.acido303.transactionflow.reporting.entity.PipelineStatus;
import com.acido303.transactionflow.reporting.entity.SparkJobMetrics;
import com.acido303.transactionflow.reporting.repository.HighValueTransactionRepository;
import com.acido303.transactionflow.reporting.repository.PipelineStatusRepository;
import com.acido303.transactionflow.reporting.repository.RecentTransactionRepository;
import com.acido303.transactionflow.reporting.repository.SparkJobMetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PipelineStatusService {

    private final SparkJobMetricsRepository sparkJobMetricsRepository;
    private final HighValueTransactionRepository highValueTransactionRepository;
    private final RecentTransactionRepository recentTransactionRepository;
    private final PipelineStatusRepository pipelineStatusRepository;

    private final AtomicLong requestsServed = new AtomicLong(0);

    public PipelineFlowResponse getPipelineFlow() {
        requestsServed.incrementAndGet();

        Optional<SparkJobMetrics> latestSpark = safeQuery(() -> sparkJobMetricsRepository.findTop1ByOrderByRecordedAtDesc());
        long highValueCount = safeCount(() -> highValueTransactionRepository.count());
        long recentCount    = safeCount(() -> recentTransactionRepository.count());

        List<PipelineStatus> latestStatuses = safeGetLatestStatuses();
        Map<String, PipelineStatus> statusByComponent = latestStatuses.stream()
                .collect(Collectors.toMap(PipelineStatus::getComponentName, s -> s, (a, b) -> b));

        String now = DateTimeFormatter.ISO_INSTANT.format(Instant.now());

        SparkJobMetrics sparkMetrics = latestSpark.orElse(null);

        long processedMessages   = longOrZero(sparkMetrics, SparkJobMetrics::getProcessedMessages);
        long rejectedMessages    = longOrZero(sparkMetrics, SparkJobMetrics::getRejectedMessages);
        long rawFilesWritten     = longOrZero(sparkMetrics, SparkJobMetrics::getRawFilesWritten);
        long rejectedFilesWritten = longOrZero(sparkMetrics, SparkJobMetrics::getRejectedFilesWritten);
        long batchDurationMs     = longOrZero(sparkMetrics, SparkJobMetrics::getBatchDurationMs);
        long batchId             = longOrZero(sparkMetrics, SparkJobMetrics::getBatchId);
        double rowsPerSecond     = sparkMetrics != null && sparkMetrics.getRowsPerSecond() != null
                ? sparkMetrics.getRowsPerSecond().doubleValue() : 0.0;
        String lastBatchAt       = sparkMetrics != null && sparkMetrics.getRecordedAt() != null
                ? DateTimeFormatter.ISO_INSTANT.format(sparkMetrics.getRecordedAt()) : null;

        String sparkStatus    = getStatus(statusByComponent, "spark",    sparkMetrics != null ? "RUNNING" : "STARTING");
        String producerStatus = getStatus(statusByComponent, "producer", processedMessages + rejectedMessages > 0 ? "RUNNING" : "STARTING");
        String kafkaStatus    = getStatus(statusByComponent, "kafka",    processedMessages + rejectedMessages > 0 ? "OK" : "STARTING");
        String hdfsStatus     = getStatus(statusByComponent, "hdfs",     rawFilesWritten > 0 ? "OK" : "STARTING");
        String pgStatus       = recentCount > 0 || highValueCount > 0 ? "OK" : "STARTING";

        // ── Components map (keys match frontend node IDs) ─────────────────────
        Map<String, Object> components = new HashMap<>();

        Map<String, Object> producer = new HashMap<>();
        producer.put("status", producerStatus);
        producer.put("messagesSent", processedMessages + rejectedMessages);
        producer.put("ratePerSecond", rowsPerSecond);
        producer.put("lastEventTimestamp", lastBatchAt);
        components.put("producer", producer);

        Map<String, Object> kafka = new HashMap<>();
        kafka.put("status", kafkaStatus);
        kafka.put("topic", "transactions.raw");
        kafka.put("messagesInTopic", processedMessages + rejectedMessages);
        kafka.put("consumerLag", Math.max(0, (processedMessages + rejectedMessages) - processedMessages));
        kafka.put("lastMessageAt", lastBatchAt);
        components.put("kafka", kafka);

        Map<String, Object> spark = new HashMap<>();
        spark.put("status", sparkStatus);
        spark.put("processedMessages", processedMessages);
        spark.put("rejectedMessages", rejectedMessages);
        spark.put("lastBatchId", batchId);
        spark.put("rowsPerSecond", rowsPerSecond);
        spark.put("batchDurationMs", batchDurationMs);
        spark.put("lastBatchAt", lastBatchAt);
        components.put("spark", spark);

        Map<String, Object> hdfs = new HashMap<>();
        hdfs.put("status", hdfsStatus);
        hdfs.put("rawFiles", rawFilesWritten);
        hdfs.put("rejectedFiles", rejectedFilesWritten);
        hdfs.put("checkpointStatus", rawFilesWritten > 0 ? "ACTIVE" : "UNKNOWN");
        hdfs.put("lastWriteTimestamp", lastBatchAt);
        components.put("hdfs", hdfs);

        Map<String, Object> postgresql = new HashMap<>();
        postgresql.put("status", pgStatus);
        postgresql.put("metricRows", recentCount);
        postgresql.put("highValueRows", highValueCount);
        postgresql.put("lastUpdateTimestamp", lastBatchAt);
        components.put("postgresql", postgresql);

        Map<String, Object> reportingApi = new HashMap<>();
        reportingApi.put("status", "RUNNING");
        reportingApi.put("requestsServed", requestsServed.get());
        reportingApi.put("lastRequestTimestamp", now);
        components.put("reporting-api", reportingApi);

        Map<String, Object> frontend = new HashMap<>();
        frontend.put("status", "ACTIVE");
        frontend.put("lastRefreshAt", now);
        components.put("frontend", frontend);

        // ── Connections list ───────────────────────────────────────────────────
        List<Map<String, Object>> connections = new ArrayList<>();

        connections.add(connection("producer", "kafka",
                isActive(producerStatus, kafkaStatus),
                processedMessages + rejectedMessages));

        connections.add(connection("kafka", "spark",
                isActive(kafkaStatus, sparkStatus),
                processedMessages + rejectedMessages));

        connections.add(connection("spark", "hdfs",
                isActive(sparkStatus, hdfsStatus),
                rawFilesWritten + rejectedFilesWritten));

        connections.add(connection("spark", "postgresql",
                isActive(sparkStatus, pgStatus),
                recentCount + highValueCount));

        connections.add(connection("postgresql", "reporting-api",
                isActive(pgStatus, "RUNNING"),
                requestsServed.get()));

        connections.add(connection("reporting-api", "frontend", true, requestsServed.get()));

        return PipelineFlowResponse.builder()
                .timestamp(now)
                .components(components)
                .connections(connections)
                .build();
    }

    public Map<String, String> getSimpleStatus() {
        requestsServed.incrementAndGet();
        List<PipelineStatus> statuses = safeGetLatestStatuses();
        Map<String, String> result = statuses.stream()
                .collect(Collectors.toMap(PipelineStatus::getComponentName, PipelineStatus::getStatus, (a, b) -> b));
        result.put("reporting-api", "RUNNING");
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> connection(String from, String to, boolean active, long messagesTransferred) {
        Map<String, Object> c = new HashMap<>();
        c.put("from", from);
        c.put("to", to);
        c.put("active", active);
        c.put("messagesTransferred", messagesTransferred);
        return c;
    }

    private boolean isActive(String... statuses) {
        for (String s : statuses) {
            if ("STARTING".equals(s) || "ERROR".equals(s)) return false;
        }
        return true;
    }

    private String getStatus(Map<String, PipelineStatus> map, String name, String fallback) {
        PipelineStatus ps = map.get(name);
        return ps != null ? ps.getStatus() : fallback;
    }

    private long longOrZero(SparkJobMetrics m, java.util.function.Function<SparkJobMetrics, Long> getter) {
        if (m == null) return 0L;
        Long v = getter.apply(m);
        return v != null ? v : 0L;
    }

    private List<PipelineStatus> safeGetLatestStatuses() {
        try {
            return pipelineStatusRepository.findLatestPerComponent();
        } catch (Exception e) {
            return List.of();
        }
    }

    private Optional<SparkJobMetrics> safeQuery(java.util.function.Supplier<Optional<SparkJobMetrics>> supplier) {
        try {
            return supplier.get();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private long safeCount(java.util.function.Supplier<Long> supplier) {
        try {
            return supplier.get();
        } catch (Exception e) {
            return 0L;
        }
    }
}
