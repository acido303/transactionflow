package com.acido303.transactionflow.reporting.controller;

import com.acido303.transactionflow.reporting.dto.CountryMapDataResponse;
import com.acido303.transactionflow.reporting.dto.MetricsSummaryResponse;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCurrency;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByCountry;
import com.acido303.transactionflow.reporting.entity.TransactionMetricsByType;
import com.acido303.transactionflow.reporting.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/summary")
    public MetricsSummaryResponse getSummary() {
        return metricsService.getSummary();
    }

    @GetMapping("/currency")
    public List<TransactionMetricsByCurrency> getCurrencyMetrics() {
        return metricsService.getLatestCurrencyMetrics();
    }

    @GetMapping("/type")
    public List<TransactionMetricsByType> getTypeMetrics() {
        return metricsService.getLatestTypeMetrics();
    }

    @GetMapping("/countries")
    public List<TransactionMetricsByCountry> getCountryMetrics() {
        return metricsService.getLatestCountryMetrics();
    }

    @GetMapping("/map/countries")
    public CountryMapDataResponse getCountryMapData() {
        return metricsService.getCountryMapData();
    }
}
