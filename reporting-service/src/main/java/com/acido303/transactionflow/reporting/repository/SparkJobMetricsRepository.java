package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.SparkJobMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SparkJobMetricsRepository extends JpaRepository<SparkJobMetrics, Long> {

    Optional<SparkJobMetrics> findTop1ByOrderByRecordedAtDesc();
}
