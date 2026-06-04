package com.acido303.transactionflow.reporting.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CountryMapDataResponse {

    private List<CountryMetricDto> countries;
}
