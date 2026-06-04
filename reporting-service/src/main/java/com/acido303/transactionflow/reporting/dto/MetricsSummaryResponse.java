package com.acido303.transactionflow.reporting.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MetricsSummaryResponse {

    private long totalTransactions;
    private long rejectedTransactions;
    private long highValueTransactions;
    private BigDecimal totalAmountEur;
    private BigDecimal totalAmountGbp;
    private BigDecimal totalAmountUsd;
}
