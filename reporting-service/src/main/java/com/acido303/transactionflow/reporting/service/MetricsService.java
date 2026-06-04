package com.acido303.transactionflow.reporting.service;

import com.acido303.transactionflow.reporting.dto.CountryMapDataResponse;
import com.acido303.transactionflow.reporting.dto.CountryMetricDto;
import com.acido303.transactionflow.reporting.dto.MetricsSummaryResponse;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCurrency;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCountry;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByType;
import com.acido303.transactionflow.reporting.repository.HighValueTransactionRepository;
import com.acido303.transactionflow.reporting.repository.MetricsByCurrencyRepository;
import com.acido303.transactionflow.reporting.repository.MetricsByCountryRepository;
import com.acido303.transactionflow.reporting.repository.MetricsByTypeRepository;
import com.acido303.transactionflow.reporting.repository.RecentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final MetricsByCurrencyRepository metricsByCurrencyRepository;
    private final MetricsByTypeRepository metricsByTypeRepository;
    private final MetricsByCountryRepository metricsByCountryRepository;
    private final HighValueTransactionRepository highValueTransactionRepository;
    private final RecentTransactionRepository recentTransactionRepository;

    public MetricsSummaryResponse getSummary() {
        long totalTransactions = recentTransactionRepository.count();
        long rejectedTransactions = recentTransactionRepository.findTop20ByStatusOrderByCreatedAtDesc("REJECTED").size();
        long highValueTransactions = highValueTransactionRepository.count();

        List<TransactionMetricsByCurrency> currencyMetrics = metricsByCurrencyRepository.findLatestByCurrency();

        BigDecimal totalAmountEur = currencyMetrics.stream()
                .filter(m -> "EUR".equalsIgnoreCase(m.getCurrency()))
                .map(m -> m.getTotalAmount() != null ? m.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmountGbp = currencyMetrics.stream()
                .filter(m -> "GBP".equalsIgnoreCase(m.getCurrency()))
                .map(m -> m.getTotalAmount() != null ? m.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmountUsd = currencyMetrics.stream()
                .filter(m -> "USD".equalsIgnoreCase(m.getCurrency()))
                .map(m -> m.getTotalAmount() != null ? m.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return MetricsSummaryResponse.builder()
                .totalTransactions(totalTransactions)
                .rejectedTransactions(rejectedTransactions)
                .highValueTransactions(highValueTransactions)
                .totalAmountEur(totalAmountEur)
                .totalAmountGbp(totalAmountGbp)
                .totalAmountUsd(totalAmountUsd)
                .build();
    }

    public List<TransactionMetricsByCurrency> getLatestCurrencyMetrics() {
        return metricsByCurrencyRepository.findLatestByCurrency();
    }

    public List<TransactionMetricsByType> getLatestTypeMetrics() {
        return metricsByTypeRepository.findLatestByType();
    }

    public List<TransactionMetricsByCountry> getLatestCountryMetrics() {
        return metricsByCountryRepository.findLatestByCountry();
    }

    public CountryMapDataResponse getCountryMapData() {
        List<TransactionMetricsByCountry> countryMetrics = metricsByCountryRepository.findLatestByCountry();

        List<CountryMetricDto> countries = countryMetrics.stream()
                .map(m -> CountryMetricDto.builder()
                        .countryCode(m.getCountryCode())
                        .countryName(m.getCountryName())
                        .transactionCount(m.getTransactionCount())
                        .totalAmount(m.getTotalAmount())
                        .averageAmount(m.getAverageAmount())
                        .currency("EUR")
                        .highValueCount(m.getHighValueCount())
                        .rejectedCount(m.getRejectedCount())
                        .lastTransactionAt(m.getLastTransactionAt())
                        .build())
                .collect(Collectors.toList());

        return CountryMapDataResponse.builder()
                .countries(countries)
                .build();
    }
}
