package com.agrilink.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a fraud case/report.
 */
@Entity
@Table(name = "fraud_cases", indexes = {
        @Index(name = "idx_fraud_status", columnList = "status"),
        @Index(name = "idx_fraud_reporter_id", columnList = "reporter_id"),
        @Index(name = "idx_fraud_accused_id", columnList = "accused_id"),
        @Index(name = "idx_fraud_created_at", columnList = "created_at"),
        @Index(name = "idx_fraud_order_id", columnList = "order_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "case_number", nullable = false, unique = true, length = 50)
    private String caseNumber;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(name = "accused_id", nullable = false)
    private UUID accusedId;

    @Column(name = "order_id")
    private UUID orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_type", nullable = false, length = 50)
    private FraudType fraudType;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
        @Builder.Default
        private FraudPriority priority = FraudPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
        @Builder.Default
        private FraudStatus status = FraudStatus.OPEN;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "evidence_details", columnDefinition = "TEXT")
    private String evidenceDetails;

    @Column(name = "investigation_notes", columnDefinition = "TEXT")
    private String investigationNotes;

    @Column(name = "resolved_reason", columnDefinition = "TEXT")
    private String resolvedReason;

    @Column(name = "resolved_by_id")
    private UUID resolvedById;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    /**
     * Enum for fraud types
     */
    public enum FraudType {
        PAYMENT_FRAUD,           // Unauthorized payment or chargebacks
        IDENTITY_FRAUD,          // Fake identity or credentials
        PRODUCT_FRAUD,           // Selling counterfeit or wrong products
        NON_DELIVERY,            // Seller not delivering goods
        NON_PAYMENT,             // Buyer not paying after confirmation
        ACCOUNT_COMPROMISE,      // Hacked or compromised account
        SUSPICIOUS_ACTIVITY,     // Unusual transaction patterns
        OTHER
    }

    /**
     * Enum for fraud priority levels
     */
    public enum FraudPriority {
        LOW,      // Minor issue, can wait
        MEDIUM,   // Normal priority
        HIGH,     // Urgent investigation needed
        CRITICAL  // Immediate action required
    }

    /**
     * Enum for fraud case status
     */
    public enum FraudStatus {
        OPEN,           // New case, not yet reviewed
        INVESTIGATING,  // Under investigation by admin
        RESOLVED,       // Case resolved
        CLOSED,         // Case closed without resolution
        ESCALATED       // Escalated to higher authority
    }
}
