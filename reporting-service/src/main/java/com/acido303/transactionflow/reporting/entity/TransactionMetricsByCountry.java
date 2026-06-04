package com.acido303.transactionflow.reporting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transaction_metrics_by_country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionMetricsByCountry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "window_start")
    private Instant windowStart;

    @Column(name = "window_end")
    private Instant windowEnd;

    @Column(name = "country_code")
    private String countryCode;

    @Column(name = "country_name")
    private String countryName;

    @Column(name = "transaction_count")
    private Long transactionCount;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "average_amount")
    private BigDecimal averageAmount;

    @Column(name = "high_value_count")
    private Long highValueCount;

    @Column(name = "rejected_count")
    private Long rejectedCount;

    @Column(name = "last_transaction_at")
    private Instant lastTransactionAt;

    @Column(name = "created_at")
    private Instant createdAt;
}
