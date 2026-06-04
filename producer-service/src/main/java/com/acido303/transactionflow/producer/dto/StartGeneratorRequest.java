package com.acido303.transactionflow.producer.dto;

import lombok.Data;

/**
 * Request body for POST /api/generator/start.
 */
@Data
public class StartGeneratorRequest {

    /** Number of transaction events to publish per second. Default: 5. */
    private int eventsPerSecond = 5;

    /** Percentage of generated events that should be invalid (0–100). Default: 2. */
    private int invalidPercentage = 2;

    /** Percentage of generated events that should be high-value (0–100). Default: 1. */
    private int highValuePercentage = 1;

    /** Percentage of generated events that should have an unknown type (0–100). Default: 3. */
    private int unknownTypePercentage = 3;
}
