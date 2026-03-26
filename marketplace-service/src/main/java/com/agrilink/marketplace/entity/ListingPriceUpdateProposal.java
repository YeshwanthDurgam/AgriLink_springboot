package com.agrilink.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "listing_price_update_proposals", indexes = {
        @Index(name = "idx_price_update_listing_status", columnList = "listing_id,status"),
        @Index(name = "idx_price_update_seller_status", columnList = "seller_id,status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingPriceUpdateProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "matched_commodity", length = 120)
    private String matchedCommodity;

    @Column(name = "current_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "suggested_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal suggestedPrice;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "market_source", length = 120)
    private String marketSource;

    @Column(name = "market_name", length = 255)
    private String marketName;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "reason", length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    public enum ProposalStatus {
        PENDING,
        APPROVED,
        DENIED,
        EXPIRED
    }
}
