package com.acido303.transactionflow.producer.generator;

import com.acido303.transactionflow.producer.model.TransactionEvent;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Random;

/**
 * Generates synthetic financial transaction events for testing and simulation.
 */
@Component
public class TransactionGenerator {

    private static final Random RANDOM = new Random();

    // -------------------------------------------------------------------------
    // Reference data
    // -------------------------------------------------------------------------

    private static final List<String> MERCHANTS = List.of(
            "Amazon", "Tesco", "Lidl", "Aldi", "Dunnes Stores",
            "Ryanair", "Aer Lingus", "Netflix", "Spotify", "Uber",
            "Bolt", "Apple", "Google", "Microsoft", "Booking.com"
    );

    private static final List<String[]> COUNTRIES = List.of(
            new String[]{"IE", "Ireland"},
            new String[]{"ES", "Spain"},
            new String[]{"GB", "United Kingdom"},
            new String[]{"FR", "France"},
            new String[]{"DE", "Germany"},
            new String[]{"NL", "Netherlands"},
            new String[]{"US", "United States"},
            new String[]{"PT", "Portugal"},
            new String[]{"IT", "Italy"},
            new String[]{"PL", "Poland"},
            new String[]{"BR", "Brazil"},
            new String[]{"AR", "Argentina"},
            new String[]{"MX", "Mexico"},
            new String[]{"CA", "Canada"},
            new String[]{"AU", "Australia"},
            new String[]{"JP", "Japan"},
            new String[]{"CN", "China"},
            new String[]{"IN", "India"},
            new String[]{"ZA", "South Africa"},
            new String[]{"SE", "Sweden"},
            new String[]{"NO", "Norway"},
            new String[]{"FI", "Finland"},
            new String[]{"DK", "Denmark"},
            new String[]{"BE", "Belgium"},
            new String[]{"CH", "Switzerland"},
            new String[]{"AT", "Austria"}
    );

    private static final List<String> CURRENCIES = List.of("EUR", "GBP", "USD");

    private static final List<String> VALID_TYPES = List.of(
            "CARD_PAYMENT", "CASH_WITHDRAWAL", "BANK_TRANSFER", "DIRECT_DEBIT", "REFUND"
    );

    private static final List<String> UNKNOWN_TYPES = List.of(
            "APPLE_PAY", "GOOGLE_PAY", "CRYPTO_TRANSFER",
            "REVOLUT_TRANSFER", "PAYPAL_PAYMENT", "ATM_REVERSAL", "INTERNAL_ADJUSTMENT"
    );

    // -------------------------------------------------------------------------
    // Public factory methods
    // -------------------------------------------------------------------------

    /**
     * Generates a normal, valid transaction with a standard amount (1.00–500.00).
     */
    public TransactionEvent generateValid() {
        String type = randomFrom(VALID_TYPES);
        return buildBase(type, null)
                .amount(randomAmount(BigDecimal.valueOf(1.00), BigDecimal.valueOf(500.00)))
                .merchant(type.equals("CARD_PAYMENT") ? randomFrom(MERCHANTS) : null)
                .build();
    }

    /**
     * Generates a transaction that is deliberately invalid — either a non-positive
     * amount or a missing required field.
     */
    public TransactionEvent generateInvalid() {
        int scenario = RANDOM.nextInt(3);
        TransactionEvent.TransactionEventBuilder builder = buildBase(randomFrom(VALID_TYPES), null);

        switch (scenario) {
            case 0 -> builder.amount(BigDecimal.ZERO);
            case 1 -> builder.amount(BigDecimal.valueOf(-(RANDOM.nextDouble() * 500 + 0.01)).setScale(2, RoundingMode.HALF_UP));
            case 2 -> builder.accountId(null); // missing required field
            default -> builder.amount(BigDecimal.ZERO);
        }

        return builder.build();
    }

    /**
     * Generates a high-value transaction with amount 10,000–50,000.
     */
    public TransactionEvent generateHighValue() {
        String type = randomFrom(List.of("BANK_TRANSFER", "CARD_PAYMENT", "DIRECT_DEBIT"));
        return buildBase(type, null)
                .amount(randomAmount(BigDecimal.valueOf(10_000.00), BigDecimal.valueOf(50_000.00)))
                .merchant(type.equals("CARD_PAYMENT") ? randomFrom(MERCHANTS) : null)
                .build();
    }

    /**
     * Generates a transaction whose type is not in the recognised set.
     * The transactionType is set to UNKNOWN and the original value is preserved
     * in originalTransactionType. The amount is valid (1.00–500.00).
     */
    public TransactionEvent generateUnknownType() {
        String originalType = randomFrom(UNKNOWN_TYPES);
        return buildBase("UNKNOWN", originalType)
                .amount(randomAmount(BigDecimal.valueOf(1.00), BigDecimal.valueOf(500.00)))
                .build();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a base TransactionEvent.TransactionEventBuilder with all common fields populated.
     */
    private TransactionEvent.TransactionEventBuilder buildBase(String transactionType, String originalTransactionType) {
        String[] country = randomCountry();
        int accountNum = 10_001 + RANDOM.nextInt(90_000);
        int customerNum = 50_001 + RANDOM.nextInt(90_000);

        return TransactionEvent.builder()
                .transactionId(UuidGenerator.generateTransactionId())
                .accountId("ACC-" + accountNum)
                .customerId("CUS-" + customerNum)
                .transactionType(transactionType)
                .originalTransactionType(originalTransactionType)
                .currency(randomFrom(CURRENCIES))
                .countryCode(country[0])
                .countryName(country[1])
                .createdAt(Instant.now());
    }

    private BigDecimal randomAmount(BigDecimal min, BigDecimal max) {
        double range = max.subtract(min).doubleValue();
        double value = min.doubleValue() + RANDOM.nextDouble() * range;
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static <T> T randomFrom(List<T> list) {
        return list.get(RANDOM.nextInt(list.size()));
    }

    private String[] randomCountry() {
        return COUNTRIES.get(RANDOM.nextInt(COUNTRIES.size()));
    }
}
