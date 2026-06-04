package com.acido303.transactionflow.producer.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Response body returned by GET /api/generator/status and the start/stop endpoints.
 */
@Data
@Builder
public class GeneratorStatusResponse {

    /** Whether the scheduled generator is currently running. */
    private boolean running;

    /** Configured number of events per second. */
    private int eventsPerSecond;

    /** Configured percentage of invalid events. */
    private int invalidPercentage;

    /** Configured percentage of high-value events. */
    private int highValuePercentage;

    /** Configured percentage of unknown-type events. */
    private int unknownTypePercentage;

    /** Total messages successfully sent to Kafka since service startup. */
    private long messagesSent;

    /** Approximate publish rate in events/second (rolling calculation). */
    private double ratePerSecond;

    /** ISO-8601 timestamp of the last event sent, or null if none yet. */
    private String lastEventTimestamp;

    /** ISO-8601 timestamp when the generator was last started, or null if never started. */
    private String startedAt;
}
