package com.acido303.transactionflow.producer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the TransactionFlow Producer Service.
 *
 * <p>This service generates synthetic financial transaction events and
 * publishes them to the {@code transactions.raw} Kafka topic.</p>
 */
@SpringBootApplication
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }
}
