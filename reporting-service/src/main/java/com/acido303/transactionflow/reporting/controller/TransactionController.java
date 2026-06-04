package com.acido303.transactionflow.reporting.controller;

import com.acido303.transactionflow.reporting.entity.HighValueTransaction;
import com.acido303.transactionflow.reporting.entity.RecentTransaction;
import com.acido303.transactionflow.reporting.repository.HighValueTransactionRepository;
import com.acido303.transactionflow.reporting.repository.RecentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TransactionController {

    private final RecentTransactionRepository recentTransactionRepository;
    private final HighValueTransactionRepository highValueTransactionRepository;

    @GetMapping("/recent")
    public List<RecentTransaction> getRecentTransactions() {
        return recentTransactionRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @GetMapping("/high-value")
    public List<HighValueTransaction> getHighValueTransactions() {
        return highValueTransactionRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
