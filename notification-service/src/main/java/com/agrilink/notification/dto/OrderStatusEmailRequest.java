package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for order status update email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Order number is required")
    private String orderNumber;

    @NotBlank(message = "Status is required")
    private String status;

    private String statusMessage;

    private String trackingNumber;
}
