package com.agrilink.order.repository;

import com.agrilink.order.entity.FraudCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for FraudCase entity.
 */
@Repository
public interface FraudCaseRepository extends JpaRepository<FraudCase, UUID> {

    /**
     * Find all fraud cases with pagination.
     */
    Page<FraudCase> findAll(Pageable pageable);

    /**
     * Find fraud cases by status.
     */
    Page<FraudCase> findByStatus(FraudCase.FraudStatus status, Pageable pageable);

    /**
     * Find fraud cases by priority.
     */
    Page<FraudCase> findByPriority(FraudCase.FraudPriority priority, Pageable pageable);

    /**
     * Find fraud cases by fraud type.
     */
    Page<FraudCase> findByFraudType(FraudCase.FraudType fraudType, Pageable pageable);

    /**
     * Find fraud cases by reporter ID.
     */
    Page<FraudCase> findByReporterId(UUID reporterId, Pageable pageable);

    /**
     * Find fraud cases by accused ID.
     */
    Page<FraudCase> findByAccusedId(UUID accusedId, Pageable pageable);

    /**
     * Find fraud cases by order ID.
     */
    List<FraudCase> findByOrderId(UUID orderId);

    /**
     * Find fraud cases by status and created date range.
     */
    @Query("SELECT f FROM FraudCase f WHERE f.status = :status AND f.createdAt BETWEEN :startDate AND :endDate")
    Page<FraudCase> findByStatusAndDateRange(
            @Param("status") FraudCase.FraudStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Count open fraud cases.
     */
    long countByStatus(FraudCase.FraudStatus status);

    /**
     * Find recent fraud cases.
     */
    @Query(value = "SELECT f FROM FraudCase f ORDER BY f.createdAt DESC LIMIT :limit")
    List<FraudCase> findRecentCases(@Param("limit") int limit);
}
