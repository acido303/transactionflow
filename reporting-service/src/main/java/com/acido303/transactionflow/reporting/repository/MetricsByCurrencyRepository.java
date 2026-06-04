package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCurrency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetricsByCurrencyRepository extends JpaRepository<TransactionMetricsByCurrency, Long> {

    List<TransactionMetricsByCurrency> findTop10ByOrderByWindowStartDesc();

    @Query("SELECT m FROM TransactionMetricsByCurrency m WHERE m.windowStart = " +
           "(SELECT MAX(m2.windowStart) FROM TransactionMetricsByCurrency m2)")
    List<TransactionMetricsByCurrency> findLatestByCurrency();
}
