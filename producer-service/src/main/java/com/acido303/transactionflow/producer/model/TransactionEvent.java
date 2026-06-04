package com.acido303.transactionflow.producer.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent {

    /**
     * UUIDv7 string — monotonically increasing, time-ordered unique identifier.
     */
    private String transactionId;

    /** e.g. "ACC-10001" */
    private String accountId;

    /** e.g. "CUS-50001" */
    private String customerId;

    /**
     * Normalised transaction type.
     * One of: CARD_PAYMENT, CASH_WITHDRAWAL, BANK_TRANSFER, DIRECT_DEBIT, REFUND, UNKNOWN
     */
    private String transactionType;

    /**
     * Non-null only when the original type was not recognised and was normalised to UNKNOWN.
     */
    private String originalTransactionType;

    private BigDecimal amount;

    /** ISO 4217 currency code — EUR, GBP, or USD. */
    private String currency;

    /** Merchant name — may be null for non-card transactions. */
    private String merchant;

    /** ISO 3166-1 alpha-2 country code. */
    private String countryCode;

    private String countryName;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant createdAt;
}
