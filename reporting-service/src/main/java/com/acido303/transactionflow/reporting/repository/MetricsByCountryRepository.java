package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCountry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetricsByCountryRepository extends JpaRepository<TransactionMetricsByCountry, Long> {

    @Query("SELECT m FROM TransactionMetricsByCountry m WHERE m.windowStart = " +
           "(SELECT MAX(m2.windowStart) FROM TransactionMetricsByCountry m2 WHERE m2.countryCode = m.countryCode)")
    List<TransactionMetricsByCountry> findLatestByCountry();

    @Query("SELECT DISTINCT m.countryCode FROM TransactionMetricsByCountry m")
    List<String> findAllDistinctCountryCodes();
}
