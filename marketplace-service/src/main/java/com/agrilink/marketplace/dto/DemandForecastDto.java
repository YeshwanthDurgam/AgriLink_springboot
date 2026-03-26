package com.agrilink.marketplace.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for demand forecast response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecastDto {
    
    private String cropType;
    private String district;
    private String state;
    
    // Demand level: HIGH, MEDIUM, LOW
    private String demandLevel;
    
    // Price range
    private BigDecimal minPricePerKg;
    private BigDecimal maxPricePerKg;
    private String priceUnit;
    
    // Market trend message
    private String trendMessage;
    
    // Trend direction: UP, DOWN, STABLE
    private String trendDirection;
    
    // Confidence level: HIGH, MEDIUM, LOW
    private String confidence;
    
    // Season relevance
    private String seasonRecommendation;
    
    // Flag to indicate if data is simulated
    private boolean isSimulated;
    
    // Additional insights
    private String marketInsight;

    // Data quality metadata
    private String dataSource;
    private LocalDateTime generatedAt;
    private Integer dataFreshnessMinutes;
    private Integer confidenceScore;
}
