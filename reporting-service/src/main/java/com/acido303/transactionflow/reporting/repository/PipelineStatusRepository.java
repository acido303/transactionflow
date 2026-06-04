package com.acido303.transactionflow.reporting.repository;

import com.acido303.transactionflow.reporting.entity.PipelineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineStatusRepository extends JpaRepository<PipelineStatus, Long> {

    List<PipelineStatus> findByComponentName(String componentName);

    @Query("SELECT p FROM PipelineStatus p WHERE p.lastUpdatedAt = " +
           "(SELECT MAX(p2.lastUpdatedAt) FROM PipelineStatus p2 WHERE p2.componentName = p.componentName)")
    List<PipelineStatus> findLatestPerComponent();
}
