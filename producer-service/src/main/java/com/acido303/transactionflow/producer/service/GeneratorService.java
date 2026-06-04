package com.acido303.transactionflow.producer.service;

import com.acido303.transactionflow.producer.dto.BurstRequest;
import com.acido303.transactionflow.producer.dto.GeneratorStatusResponse;
import com.acido303.transactionflow.producer.dto.StartGeneratorRequest;
import com.acido303.transactionflow.producer.generator.TransactionGenerator;
import com.acido303.transactionflow.producer.model.TransactionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Manages the lifecycle of the scheduled transaction generator.
 *
 * <p>The generator fires once per second and emits {@code eventsPerSecond} events.
 * Each event's category (invalid / high-value / unknown-type / normal) is decided
 * by rolling a random number against the configured percentage thresholds.</p>
 */
@Slf4j
@Service
public class GeneratorService {

    private static final Random RANDOM = new Random();

    private final TransactionGenerator transactionGenerator;
    private final KafkaProducerService kafkaProducerService;

    // ---- mutable generator state (all access is guarded by `this`) ----------
    private ScheduledExecutorService scheduler;
    private volatile boolean running = false;
    private volatile int eventsPerSecond = 5;
    private volatile int invalidPercentage = 2;
    private volatile int highValuePercentage = 1;
    private volatile int unknownTypePercentage = 3;
    private volatile Instant startedAt;

    public GeneratorService(TransactionGenerator transactionGenerator,
                            KafkaProducerService kafkaProducerService) {
        this.transactionGenerator = transactionGenerator;
        this.kafkaProducerService = kafkaProducerService;
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Starts (or restarts) the scheduled generator with the supplied configuration.
     */
    public synchronized void start(StartGeneratorRequest req) {
        if (running) {
            log.info("Generator is already running — restarting with new config");
            stopInternal();
        }

        eventsPerSecond      = req.getEventsPerSecond();
        invalidPercentage    = req.getInvalidPercentage();
        highValuePercentage  = req.getHighValuePercentage();
        unknownTypePercentage = req.getUnknownTypePercentage();
        startedAt            = Instant.now();
        running              = true;

        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "tx-generator");
            t.setDaemon(true);
            return t;
        });

        // Capture current config values for the lambda (they're volatile, but
        // we want a consistent snapshot for this scheduled run).
        scheduler.scheduleAtFixedRate(this::tick, 0, 1, TimeUnit.SECONDS);

        log.info("Generator started: eventsPerSecond={} invalidPct={} highValuePct={} unknownTypePct={}",
                eventsPerSecond, invalidPercentage, highValuePercentage, unknownTypePercentage);
    }

    /**
     * Stops the scheduled generator gracefully.
     */
    public synchronized void stop() {
        if (!running) {
            log.info("Generator is not running — nothing to stop");
            return;
        }
        stopInternal();
        log.info("Generator stopped");
    }

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------

    public GeneratorStatusResponse getStatus() {
        Instant lastEvent = kafkaProducerService.getLastEventTimestamp();
        long sent = kafkaProducerService.getMessagesSent();

        double rate = 0.0;
        if (running && startedAt != null) {
            long elapsedSeconds = Math.max(1,
                    java.time.Duration.between(startedAt, Instant.now()).getSeconds());
            rate = (double) sent / elapsedSeconds;
        }

        return GeneratorStatusResponse.builder()
                .running(running)
                .eventsPerSecond(eventsPerSecond)
                .invalidPercentage(invalidPercentage)
                .highValuePercentage(highValuePercentage)
                .unknownTypePercentage(unknownTypePercentage)
                .messagesSent(sent)
                .ratePerSecond(Math.round(rate * 100.0) / 100.0)
                .lastEventTimestamp(lastEvent != null ? lastEvent.toString() : null)
                .startedAt(startedAt != null ? startedAt.toString() : null)
                .build();
    }

    // -------------------------------------------------------------------------
    // One-shot helpers
    // -------------------------------------------------------------------------

    /**
     * Generates and immediately sends a single transaction of the requested type.
     *
     * @param type one of: "random", "invalid", "high-value", "unknown-type"
     */
    public void generateOne(String type) {
        TransactionEvent event = switch (type) {
            case "invalid"      -> transactionGenerator.generateInvalid();
            case "high-value"   -> transactionGenerator.generateHighValue();
            case "unknown-type" -> transactionGenerator.generateUnknownType();
            default             -> transactionGenerator.generateValid();  // "random"
        };
        kafkaProducerService.send(event);
        log.info("generateOne type={} transactionId={}", type, event.getTransactionId());
    }

    /**
     * Emits a burst of events synchronously, applying the per-event type distribution
     * specified in {@code req}.
     */
    public void burst(BurstRequest req) {
        log.info("Burst started: numberOfEvents={} invalidPct={} highValuePct={} unknownTypePct={}",
                req.getNumberOfEvents(), req.getInvalidPercentage(),
                req.getHighValuePercentage(), req.getUnknownTypePercentage());

        for (int i = 0; i < req.getNumberOfEvents(); i++) {
            TransactionEvent event = pickEventType(
                    req.getInvalidPercentage(),
                    req.getHighValuePercentage(),
                    req.getUnknownTypePercentage());
            kafkaProducerService.send(event);
        }

        log.info("Burst completed: {} events sent", req.getNumberOfEvents());
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    /** Called once per second by the scheduler. */
    private void tick() {
        try {
            int count = eventsPerSecond;
            for (int i = 0; i < count; i++) {
                TransactionEvent event = pickEventType(
                        invalidPercentage, highValuePercentage, unknownTypePercentage);
                kafkaProducerService.send(event);
            }
        } catch (Exception e) {
            log.error("Unexpected error in generator tick: {}", e.getMessage(), e);
        }
    }

    /**
     * Picks the category of the next event based on the supplied percentages.
     * The evaluation order is: invalid → high-value → unknown-type → normal.
     */
    private TransactionEvent pickEventType(int invalidPct, int highValuePct, int unknownTypePct) {
        int roll = RANDOM.nextInt(100); // 0–99
        if (roll < invalidPct) {
            return transactionGenerator.generateInvalid();
        } else if (roll < invalidPct + highValuePct) {
            return transactionGenerator.generateHighValue();
        } else if (roll < invalidPct + highValuePct + unknownTypePct) {
            return transactionGenerator.generateUnknownType();
        } else {
            return transactionGenerator.generateValid();
        }
    }

    private void stopInternal() {
        running = false;
        if (scheduler != null) {
            scheduler.shutdownNow();
            scheduler = null;
        }
    }
}
