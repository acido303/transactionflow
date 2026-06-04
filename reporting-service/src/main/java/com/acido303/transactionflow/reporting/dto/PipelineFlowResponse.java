package com.acido303.transactionflow.reporting.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class PipelineFlowResponse {
    private String timestamp;
    /** Keyed by component ID: producer, kafka, spark, hdfs, postgresql, reporting-api, frontend */
    private Map<String, Object> components;
    /** Each entry has: from, to, active (boolean), messagesTransferred (long, optional) */
    private List<Map<String, Object>> connections;
}
