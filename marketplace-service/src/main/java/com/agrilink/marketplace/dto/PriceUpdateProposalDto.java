package com.agrilink.marketplace.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceUpdateProposalDto {
    private UUID id;
    private UUID listingId;
    private String productName;
    private String matchedCommodity;
    private BigDecimal currentPrice;
    private BigDecimal suggestedPrice;
    private String currency;
    private String marketSource;
    private String marketName;
    private Integer confidenceScore;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime respondedAt;
}
