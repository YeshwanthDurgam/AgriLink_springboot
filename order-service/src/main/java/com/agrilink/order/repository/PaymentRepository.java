package com.agrilink.order.repository;

import com.agrilink.order.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Payment entity.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByPaymentStatus(Payment.PaymentStatus status);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    Optional<Payment> findTopByOrderIdOrderByCreatedAtDesc(UUID orderId);
}
