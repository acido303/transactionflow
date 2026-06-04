package com.acido303.transactionflow.producer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Jackson configuration that registers the {@link JavaTimeModule} so that
 * {@link java.time.Instant} values are serialised as ISO-8601 strings rather
 * than numeric timestamps.
 *
 * <p>Example output: {@code "createdAt":"2024-06-04T13:22:45.123Z"}</p>
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Register JSR-310 (java.time) support
        mapper.registerModule(new JavaTimeModule());
        // Write Instant as ISO-8601 string, not as [seconds, nanos] array
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
