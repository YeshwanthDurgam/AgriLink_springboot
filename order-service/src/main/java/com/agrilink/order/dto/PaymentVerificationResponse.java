package com.agrilink.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for payment verification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationResponse {

    private boolean success;
    private String message;

    private UUID orderId;
    private String orderNumber;
    private String orderStatus;

    private UUID paymentId;
    private String transactionId;
    private String paymentStatus;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime paidAt;

    // For redirect after payment
    private String redirectUrl;
}
