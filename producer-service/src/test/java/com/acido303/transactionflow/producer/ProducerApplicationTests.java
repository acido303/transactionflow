package com.acido303.transactionflow.producer;

import com.acido303.transactionflow.producer.generator.TransactionGenerator;
import com.acido303.transactionflow.producer.generator.UuidGenerator;
import com.acido303.transactionflow.producer.model.TransactionEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the producer-service that do NOT require a running Kafka broker.
 */
class ProducerApplicationTests {

    private final TransactionGenerator generator = new TransactionGenerator();

    @Test
    void uuidGenerator_producesNonNullUuidV7String() {
        String id = UuidGenerator.generateTransactionId();
        assertThat(id).isNotNull().hasSize(36);
        // UUIDv7 has version nibble = 7
        assertThat(id.charAt(14)).isEqualTo('7');
    }

    @Test
    void generateValid_producesValidTransaction() {
        TransactionEvent event = generator.generateValid();

        assertThat(event.getTransactionId()).isNotNull();
        assertThat(event.getAccountId()).startsWith("ACC-");
        assertThat(event.getCustomerId()).startsWith("CUS-");
        assertThat(event.getAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(event.getCurrency()).isIn("EUR", "GBP", "USD");
        assertThat(event.getTransactionType())
                .isIn("CARD_PAYMENT", "CASH_WITHDRAWAL", "BANK_TRANSFER", "DIRECT_DEBIT", "REFUND");
        assertThat(event.getOriginalTransactionType()).isNull();
        assertThat(event.getCreatedAt()).isNotNull();
    }

    @Test
    void generateHighValue_producesAmountAbove10000() {
        // Run several times to account for randomness
        for (int i = 0; i < 20; i++) {
            TransactionEvent event = generator.generateHighValue();
            assertThat(event.getAmount())
                    .isGreaterThanOrEqualTo(BigDecimal.valueOf(10_000))
                    .isLessThanOrEqualTo(BigDecimal.valueOf(50_000));
        }
    }

    @Test
    void generateUnknownType_setsTransactionTypeToUnknown() {
        TransactionEvent event = generator.generateUnknownType();

        assertThat(event.getTransactionType()).isEqualTo("UNKNOWN");
        assertThat(event.getOriginalTransactionType()).isNotNull().isNotBlank();
        assertThat(event.getAmount()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void generateInvalid_producesInvalidTransaction() {
        // At least one of: non-positive amount or null accountId
        boolean foundInvalid = false;
        for (int i = 0; i < 50; i++) {
            TransactionEvent event = generator.generateInvalid();
            boolean nonPositive = event.getAmount() != null && event.getAmount().compareTo(BigDecimal.ZERO) <= 0;
            boolean missingAccount = event.getAccountId() == null;
            if (nonPositive || missingAccount) {
                foundInvalid = true;
                break;
            }
        }
        assertThat(foundInvalid).isTrue();
    }
}
