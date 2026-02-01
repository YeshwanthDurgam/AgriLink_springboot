package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for payment receipt email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReceiptEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Order number is required")
    private String orderNumber;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;
}
