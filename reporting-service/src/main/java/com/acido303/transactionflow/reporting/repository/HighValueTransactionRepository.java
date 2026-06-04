package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.HighValueTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HighValueTransactionRepository extends JpaRepository<HighValueTransaction, UUID> {

    List<HighValueTransaction> findTop50ByOrderByCreatedAtDesc();
}
