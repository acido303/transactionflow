package com.acido303.transactionflow.reporting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "spark_job_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SparkJobMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "processed_messages")
    private Long processedMessages;

    @Column(name = "rejected_messages")
    private Long rejectedMessages;

    @Column(name = "rows_per_second")
    private BigDecimal rowsPerSecond;

    @Column(name = "batch_duration_ms")
    private Long batchDurationMs;

    @Column(name = "raw_files_written")
    private Long rawFilesWritten;

    @Column(name = "rejected_files_written")
    private Long rejectedFilesWritten;

    @Column(name = "recorded_at")
    private Instant recordedAt;
}
