package com.acido303.transactionflow.producer.service;

import com.acido303.transactionflow.producer.model.TransactionEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Handles serialisation and publishing of {@link TransactionEvent} objects to Kafka.
 */
@Slf4j
@Service
public class KafkaProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String rawTopic;

    private final AtomicLong messagesSent = new AtomicLong(0);
    private volatile Instant lastEventTimestamp;

    public KafkaProducerService(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${transactionflow.topic.raw}") String rawTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.rawTopic = rawTopic;
    }

    /**
     * Serialises {@code event} to JSON and sends it to the raw transactions topic.
     * The event's transactionId is used as the Kafka message key to preserve
     * per-account ordering when multiple partitions are in use.
     *
     * @param event the transaction event to publish
     */
    public void send(TransactionEvent event) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialise TransactionEvent transactionId={}: {}",
                    event.getTransactionId(), e.getMessage(), e);
            return;
        }

        CompletableFuture<SendResult<String, String>> future =
                kafkaTemplate.send(rawTopic, event.getTransactionId(), payload);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send transactionId={} to topic={}: {}",
                        event.getTransactionId(), rawTopic, ex.getMessage(), ex);
            } else {
                long count = messagesSent.incrementAndGet();
                lastEventTimestamp = Instant.now();
                log.debug("Sent transactionId={} to topic={} partition={} offset={} [total={}]",
                        event.getTransactionId(),
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset(),
                        count);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Stats accessors
    // -------------------------------------------------------------------------

    public long getMessagesSent() {
        return messagesSent.get();
    }

    public Instant getLastEventTimestamp() {
        return lastEventTimestamp;
    }
}
