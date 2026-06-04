package com.acido303.transactionflow.reporting.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class CountryMetricDto {

    private String countryCode;
    private String countryName;
    private Long transactionCount;
    private BigDecimal totalAmount;
    private BigDecimal averageAmount;
    private String currency;
    private Long highValueCount;
    private Long rejectedCount;
    private Instant lastTransactionAt;
}
