package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.RecentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecentTransactionRepository extends JpaRepository<RecentTransaction, Long> {

    List<RecentTransaction> findTop100ByOrderByCreatedAtDesc();

    List<RecentTransaction> findTop20ByOrderByCreatedAtDesc();

    List<RecentTransaction> findTop20ByStatusOrderByCreatedAtDesc(String status);
}
