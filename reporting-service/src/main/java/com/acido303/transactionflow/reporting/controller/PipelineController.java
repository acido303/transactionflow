package com.acido303.transactionflow.reporting.controller;

import com.acido303.transactionflow.reporting.dto.PipelineFlowResponse;
import com.acido303.transactionflow.reporting.entity.RecentTransaction;
import com.acido303.transactionflow.reporting.repository.RecentTransactionRepository;
import com.acido303.transactionflow.reporting.service.PipelineStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pipeline")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineStatusService pipelineStatusService;
    private final RecentTransactionRepository recentTransactionRepository;

    @GetMapping("/status")
    public Map<String, String> getStatus() {
        return pipelineStatusService.getSimpleStatus();
    }

    @GetMapping("/flow")
    public PipelineFlowResponse getFlow() {
        return pipelineStatusService.getPipelineFlow();
    }

    @GetMapping("/journey/latest")
    public List<RecentTransaction> getLatestJourney() {
        return recentTransactionRepository.findTop20ByOrderByCreatedAtDesc();
    }

    @GetMapping("/journey/rejected/latest")
    public List<RecentTransaction> getLatestRejectedJourney() {
        return recentTransactionRepository.findTop20ByStatusOrderByCreatedAtDesc("REJECTED");
    }
}
