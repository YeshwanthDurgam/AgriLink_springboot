package com.agrilink.marketplace.dto;

import com.agrilink.marketplace.entity.Listing;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Listing information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingDto {

    private UUID id;
    private UUID sellerId;
    private String sellerName;
    private String sellerFarmName;
    private UUID farmId;
    private UUID categoryId;
    private String categoryName;
    private String title;
    private String description;
    private String cropType;
    private BigDecimal quantity;
    private String quantityUnit;
    private BigDecimal pricePerUnit;
    private String currency;
    private BigDecimal minimumOrder;
    private LocalDate harvestDate;
    private LocalDate expiryDate;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean organicCertified;
    private String qualityGrade;
    private Listing.ListingStatus status;
    private int viewCount;
    private Double averageRating;
    private int reviewCount;
    private List<ListingImageDto> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
