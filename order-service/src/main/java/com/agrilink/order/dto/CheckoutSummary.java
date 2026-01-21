package com.agrilink.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for checkout summary (preview before payment).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSummary {

    private int itemCount;
    private BigDecimal subtotal;
    private BigDecimal shippingCharges;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private String currency;
    private BigDecimal freeShippingThreshold;
    private BigDecimal amountForFreeShipping;
    private List<ItemSummary> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemSummary {
        private UUID listingId;
        private String title;
        private String imageUrl;
        private int quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }
}
