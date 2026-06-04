package com.acido303.transactionflow.producer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratorConfigDto {

    private List<String> merchants;
    private List<CountryEntry> countries;
    private List<CountryEntry> availableCountries;
    private List<String> unknownTypes;
    private List<String> currencies;
    private List<String> validTypes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountryEntry {
        private String code;
        private String name;
    }
}
