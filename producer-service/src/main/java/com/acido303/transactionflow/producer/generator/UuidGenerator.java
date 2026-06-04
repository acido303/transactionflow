package com.acido303.transactionflow.producer.generator;

import com.github.f4b6a3.uuid.UuidCreator;

/**
 * Static helper for generating UUIDv7 (time-ordered epoch) identifiers.
 * UUIDv7 is monotonically increasing within the same millisecond, making it
 * ideal as a sortable, unique transaction identifier.
 *
 * NOTE: Never use UUID.randomUUID() for transaction IDs — use this class instead.
 */
public final class UuidGenerator {

    private UuidGenerator() {
        // utility class — no instantiation
    }

    /**
     * Generates a new UUIDv7 string using the time-ordered epoch strategy.
     *
     * @return a UUIDv7 string, e.g. "018f4e3d-1a2b-7c3d-8e4f-5a6b7c8d9e0f"
     */
    public static String generateTransactionId() {
        return UuidCreator.getTimeOrderedEpoch().toString();
    }
}
