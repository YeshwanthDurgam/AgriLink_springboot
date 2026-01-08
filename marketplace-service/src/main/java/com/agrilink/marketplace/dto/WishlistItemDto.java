package com.agrilink.marketplace.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Wishlist item response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {

    private UUID id;
    private UUID listingId;
    private String listingTitle;
    private String listingDescription;
    private String listingImageUrl;
    private BigDecimal price;
    private String unit;
    private Integer availableQuantity;
    private String categoryName;
    private UUID sellerId;
    private String sellerName;
    private LocalDateTime addedAt;
}
