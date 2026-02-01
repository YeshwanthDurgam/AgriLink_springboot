package com.agrilink.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for OrderItem information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {

    private UUID id;
    private UUID listingId;
    private String productName;
    private BigDecimal quantity;
    private String quantityUnit;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String imageUrl;
}
