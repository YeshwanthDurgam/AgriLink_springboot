package com.agrilink.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a payment with Razorpay integration.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 3)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "payment_gateway", length = 50)
    @Builder.Default
    private String paymentGateway = "RAZORPAY";

    // Razorpay specific fields
    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature", length = 200)
    private String razorpaySignature;

    @Column(name = "razorpay_receipt", length = 100)
    private String razorpayReceipt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "refund_amount", precision = 14, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum PaymentStatus {
        PENDING,
        PROCESSING, // Payment being processed
        CREATED, // Razorpay order created
        AUTHORIZED, // Payment authorized
        CAPTURED, // Payment captured
        COMPLETED, // Payment successful
        FAILED,
        REFUND_PENDING,
        REFUNDED,
        CANCELLED
    }
}
