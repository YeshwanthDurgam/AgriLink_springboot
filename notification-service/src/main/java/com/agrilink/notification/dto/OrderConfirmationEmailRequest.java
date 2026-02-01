package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for order confirmation email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfirmationEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Order number is required")
    private String orderNumber;

    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    private List<OrderItemDto> items;

    private String shippingAddress;

    private String estimatedDelivery;

    /**
     * DTO for order item in email request.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private String name;
        private int quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String imageUrl;
    }
}
