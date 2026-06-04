package com.acido303.transactionflow.producer.controller;

import com.acido303.transactionflow.producer.dto.BurstRequest;
import com.acido303.transactionflow.producer.dto.GeneratorStatusResponse;
import com.acido303.transactionflow.producer.dto.StartGeneratorRequest;
import com.acido303.transactionflow.producer.service.GeneratorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for controlling the transaction generator.
 */
@Slf4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/generator")
public class GeneratorController {

    private final GeneratorService generatorService;

    public GeneratorController(GeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Starts the scheduled generator.
     * POST /api/generator/start
     */
    @PostMapping("/start")
    public ResponseEntity<GeneratorStatusResponse> start(
            @RequestBody(required = false) StartGeneratorRequest req) {
        if (req == null) {
            req = new StartGeneratorRequest();
        }
        log.info("POST /api/generator/start — eventsPerSecond={} invalidPct={} highValuePct={} unknownTypePct={}",
                req.getEventsPerSecond(), req.getInvalidPercentage(),
                req.getHighValuePercentage(), req.getUnknownTypePercentage());
        generatorService.start(req);
        return ResponseEntity.ok(generatorService.getStatus());
    }

    /**
     * Stops the scheduled generator.
     * POST /api/generator/stop
     */
    @PostMapping("/stop")
    public ResponseEntity<GeneratorStatusResponse> stop() {
        log.info("POST /api/generator/stop");
        generatorService.stop();
        return ResponseEntity.ok(generatorService.getStatus());
    }

    /**
     * Returns current generator status.
     * GET /api/generator/status
     */
    @GetMapping("/status")
    public ResponseEntity<GeneratorStatusResponse> status() {
        return ResponseEntity.ok(generatorService.getStatus());
    }

    // -------------------------------------------------------------------------
    // One-shot transaction endpoints
    // -------------------------------------------------------------------------

    /**
     * Generates and sends one random (normal) transaction.
     * POST /api/generator/transaction/random
     */
    @PostMapping("/transaction/random")
    public ResponseEntity<GeneratorStatusResponse> sendRandom() {
        log.info("POST /api/generator/transaction/random");
        generatorService.generateOne("random");
        return ResponseEntity.ok(generatorService.getStatus());
    }

    /**
     * Generates and sends one invalid transaction.
     * POST /api/generator/transaction/invalid
     */
    @PostMapping("/transaction/invalid")
    public ResponseEntity<GeneratorStatusResponse> sendInvalid() {
        log.info("POST /api/generator/transaction/invalid");
        generatorService.generateOne("invalid");
        return ResponseEntity.ok(generatorService.getStatus());
    }

    /**
     * Generates and sends one high-value transaction.
     * POST /api/generator/transaction/high-value
     */
    @PostMapping("/transaction/high-value")
    public ResponseEntity<GeneratorStatusResponse> sendHighValue() {
        log.info("POST /api/generator/transaction/high-value");
        generatorService.generateOne("high-value");
        return ResponseEntity.ok(generatorService.getStatus());
    }

    /**
     * Generates and sends one unknown-type transaction.
     * POST /api/generator/transaction/unknown-type
     */
    @PostMapping("/transaction/unknown-type")
    public ResponseEntity<GeneratorStatusResponse> sendUnknownType() {
        log.info("POST /api/generator/transaction/unknown-type");
        generatorService.generateOne("unknown-type");
        return ResponseEntity.ok(generatorService.getStatus());
    }

    // -------------------------------------------------------------------------
    // Burst
    // -------------------------------------------------------------------------

    /**
     * Sends a burst of events in a single synchronous loop.
     * POST /api/generator/burst
     */
    @PostMapping("/burst")
    public ResponseEntity<GeneratorStatusResponse> burst(
            @RequestBody(required = false) BurstRequest req) {
        if (req == null) {
            req = new BurstRequest();
        }
        log.info("POST /api/generator/burst — numberOfEvents={}", req.getNumberOfEvents());
        generatorService.burst(req);
        return ResponseEntity.ok(generatorService.getStatus());
    }
}
