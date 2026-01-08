package com.agrilink.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for listing search criteria.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingSearchCriteria {

    private String keyword;
    private UUID categoryId;
    private List<UUID> categoryIds;
    private String cropType;
    private List<String> cropTypes;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String location;
    private Boolean organicOnly;
    private String qualityGrade;
    private List<String> qualityGrades;
    private UUID sellerId;
    
    // Location-based search
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Double radiusKm;
    
    // Additional filters
    private BigDecimal minQuantity;
    private BigDecimal maxQuantity;
    private Double minRating;
    private Boolean availableOnly;
    private Boolean hasImages;
}
