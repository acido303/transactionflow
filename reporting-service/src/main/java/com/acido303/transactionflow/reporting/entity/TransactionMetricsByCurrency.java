package com.acido303.transactionflow.reporting.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transaction_metrics_by_currency")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionMetricsByCurrency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "window_start")
    private Instant windowStart;

    @Column(name = "window_end")
    private Instant windowEnd;

    @Column(name = "currency")
    private String currency;

    @Column(name = "transaction_count")
    private Long transactionCount;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "average_amount")
    private BigDecimal averageAmount;

    @Column(name = "created_at")
    private Instant createdAt;
}
