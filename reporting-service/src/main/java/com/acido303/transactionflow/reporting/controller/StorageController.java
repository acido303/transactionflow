package com.acido303.transactionflow.reporting.controller;

import com.acido303.transactionflow.reporting.entity.SparkJobMetrics;
import com.acido303.transactionflow.reporting.repository.SparkJobMetricsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/storage")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StorageController {

    private final SparkJobMetricsRepository sparkJobMetricsRepository;

    @Value("${hdfs.namenode.url:http://hdfs-namenode:9870}")
    private String hdfsNameNodeUrl;

    @GetMapping("/hdfs/status")
    public Map<String, Object> getHdfsStatus() {
        Optional<SparkJobMetrics> latestMetrics = sparkJobMetricsRepository.findTop1ByOrderByRecordedAtDesc();

        Map<String, Object> status = new HashMap<>();
        status.put("namenodeUrl", hdfsNameNodeUrl);
        status.put("rawPath", "/data/transactions/raw");
        status.put("rejectedPath", "/data/transactions/rejected");
        status.put("checkpointPath", "/checkpoints/transactions");
        status.put("timestamp", Instant.now().toString());

        latestMetrics.ifPresentOrElse(metrics -> {
            status.put("rawFilesWritten", metrics.getRawFilesWritten() != null ? metrics.getRawFilesWritten() : 0L);
            status.put("rejectedFilesWritten", metrics.getRejectedFilesWritten() != null ? metrics.getRejectedFilesWritten() : 0L);
            status.put("lastBatchId", metrics.getBatchId());
            status.put("lastRecordedAt", metrics.getRecordedAt() != null ? metrics.getRecordedAt().toString() : null);
            status.put("checkpointStatus", "ACTIVE");
            status.put("hdfsStatus", "RUNNING");
        }, () -> {
            status.put("rawFilesWritten", 0L);
            status.put("rejectedFilesWritten", 0L);
            status.put("lastBatchId", null);
            status.put("lastRecordedAt", null);
            status.put("checkpointStatus", "UNKNOWN");
            status.put("hdfsStatus", "STARTING");
        });

        return status;
    }
}
