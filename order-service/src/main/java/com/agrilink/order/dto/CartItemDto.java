package com.agrilink.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Cart Item responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {

    private UUID id;
    private UUID listingId;
    private UUID sellerId;
    private String listingTitle;
    private String listingImageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String unit;
    private Integer availableQuantity;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
