package com.agrilink.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for checkout initialization.
 * Contains order and Razorpay payment order details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {

    private UUID orderId;
    private String orderNumber;
    private BigDecimal totalAmount;
    private BigDecimal subtotal;
    private BigDecimal shippingCharges;
    private BigDecimal tax;
    private String currency;
    private int itemCount;

    // Razorpay payment order details
    private String razorpayOrderId;
    private String razorpayKeyId;
    private BigDecimal razorpayAmount; // Amount in paise

    // Customer details for prefill
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Shipping address
    private ShippingAddress shippingAddress;

    // Order items summary
    private List<OrderItemSummary> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddress {
        private String fullName;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private String phoneNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemSummary {
        private UUID listingId;
        private String title;
        private String imageUrl;
        private int quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String sellerName;
    }
}
