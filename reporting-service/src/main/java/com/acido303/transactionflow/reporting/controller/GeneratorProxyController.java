package com.acido303.transactionflow.reporting.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/generator")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GeneratorProxyController {

    private final RestTemplate restTemplate;

    @Value("${producer.service.url:http://localhost:8081}")
    private String producerServiceUrl;

    @PostMapping("/start")
    public ResponseEntity<Object> startGenerator(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/start", body);
    }

    @PostMapping("/stop")
    public ResponseEntity<Object> stopGenerator(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/stop", body);
    }

    @GetMapping("/status")
    public ResponseEntity<Object> getGeneratorStatus() {
        return proxyGet("/api/generator/status");
    }

    @PostMapping("/transaction/random")
    public ResponseEntity<Object> sendRandomTransaction(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/transaction/random", body);
    }

    @PostMapping("/transaction/invalid")
    public ResponseEntity<Object> sendInvalidTransaction(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/transaction/invalid", body);
    }

    @PostMapping("/transaction/high-value")
    public ResponseEntity<Object> sendHighValueTransaction(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/transaction/high-value", body);
    }

    @PostMapping("/transaction/unknown-type")
    public ResponseEntity<Object> sendUnknownTypeTransaction(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/transaction/unknown-type", body);
    }

    @PostMapping("/burst")
    public ResponseEntity<Object> sendBurst(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/burst", body);
    }

    // ── Generator configuration proxy ─────────────────────────────────────────

    @GetMapping("/config")
    public ResponseEntity<Object> getConfig() {
        return proxyGet("/api/generator/config");
    }

    @PostMapping("/config/merchants")
    public ResponseEntity<Object> addMerchant(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/config/merchants", body);
    }

    @DeleteMapping("/config/merchants")
    public ResponseEntity<Object> removeMerchant(@RequestBody(required = false) Map<String, Object> body) {
        return proxyDelete("/api/generator/config/merchants", body);
    }

    @PostMapping("/config/countries")
    public ResponseEntity<Object> addCountry(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/config/countries", body);
    }

    @DeleteMapping("/config/countries")
    public ResponseEntity<Object> removeCountry(@RequestBody(required = false) Map<String, Object> body) {
        return proxyDelete("/api/generator/config/countries", body);
    }

    @PostMapping("/config/unknown-types")
    public ResponseEntity<Object> addUnknownType(@RequestBody(required = false) Map<String, Object> body) {
        return proxyPost("/api/generator/config/unknown-types", body);
    }

    @DeleteMapping("/config/unknown-types")
    public ResponseEntity<Object> removeUnknownType(@RequestBody(required = false) Map<String, Object> body) {
        return proxyDelete("/api/generator/config/unknown-types", body);
    }

    private ResponseEntity<Object> proxyGet(String path) {
        try {
            String url = producerServiceUrl + path;
            return restTemplate.exchange(url, HttpMethod.GET, null, Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "Producer service unavailable", "message", e.getMessage()));
        }
    }

    private ResponseEntity<Object> proxyPost(String path, Object body) {
        try {
            String url = producerServiceUrl + path;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            return restTemplate.exchange(url, HttpMethod.POST, entity, Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "Producer service unavailable", "message", e.getMessage()));
        }
    }

    private ResponseEntity<Object> proxyDelete(String path, Object body) {
        try {
            String url = producerServiceUrl + path;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            return restTemplate.exchange(url, HttpMethod.DELETE, entity, Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "Producer service unavailable", "message", e.getMessage()));
        }
    }
}
