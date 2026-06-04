package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.TransactionMetricsByType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetricsByTypeRepository extends JpaRepository<TransactionMetricsByType, Long> {

    List<TransactionMetricsByType> findTop10ByOrderByWindowStartDesc();

    @Query("SELECT m FROM TransactionMetricsByType m WHERE m.windowStart = " +
           "(SELECT MAX(m2.windowStart) FROM TransactionMetricsByType m2)")
    List<TransactionMetricsByType> findLatestByType();
}
