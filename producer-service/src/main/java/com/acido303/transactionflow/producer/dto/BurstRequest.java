package com.acido303.transactionflow.producer.dto;

import lombok.Data;

/**
 * Request body for POST /api/generator/burst.
 */
@Data
public class BurstRequest {

    /** Total number of events to emit in the burst. Default: 100. */
    private int numberOfEvents = 100;

    /** Percentage of burst events that should be invalid (0–100). Default: 5. */
    private int invalidPercentage = 5;

    /** Percentage of burst events that should be high-value (0–100). Default: 2. */
    private int highValuePercentage = 2;

    /** Percentage of burst events that should have an unknown type (0–100). Default: 5. */
    private int unknownTypePercentage = 5;
}
