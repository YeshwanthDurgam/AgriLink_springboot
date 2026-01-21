package com.agrilink.order.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.order.config.RazorpayConfig;
import com.agrilink.order.dto.*;
import com.agrilink.order.entity.Order;
import com.agrilink.order.entity.Payment;
import com.agrilink.order.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for Razorpay payment integration.
 * Handles payment order creation, verification, and webhooks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentRepository paymentRepository;

    /**
     * Create a Razorpay order for payment.
     * 
     * @param order  The order to create payment for
     * @param amount The amount to charge
     * @return Payment entity with Razorpay order details
     */
    @Transactional
    public Payment createPaymentOrder(Order order, BigDecimal amount) {
        log.info("Creating Razorpay order for order: {} amount: {}", order.getOrderNumber(), amount);

        try {
            // Convert amount to paise (smallest currency unit)
            long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

            // Generate unique receipt ID (max 40 chars for Razorpay)
            String receipt = "rcpt_" + order.getId().toString().substring(0, 8) + "_"
                    + (System.currentTimeMillis() % 1000000000L);

            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", razorpayConfig.getCurrency());
            orderRequest.put("receipt", receipt);
            orderRequest.put("notes", new JSONObject()
                    .put("order_id", order.getId().toString())
                    .put("order_number", order.getOrderNumber())
                    .put("buyer_id", order.getBuyerId().toString()));

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            log.info("Razorpay order created: {} for order: {}", razorpayOrderId, order.getOrderNumber());

            // Create payment record
            Payment payment = Payment.builder()
                    .order(order)
                    .paymentMethod("RAZORPAY")
                    .paymentGateway("RAZORPAY")
                    .amount(amount)
                    .currency(razorpayConfig.getCurrency())
                    .razorpayOrderId(razorpayOrderId)
                    .razorpayReceipt(receipt)
                    .paymentStatus(Payment.PaymentStatus.CREATED)
                    .build();

            return paymentRepository.save(payment);

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for order: {}", order.getOrderNumber(), e);
            throw new BadRequestException("Failed to initialize payment: " + e.getMessage());
        }
    }

    /**
     * Verify Razorpay payment signature.
     * 
     * @param orderId   Razorpay order ID
     * @param paymentId Razorpay payment ID
     * @param signature Razorpay signature
     * @return true if signature is valid
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            return Utils.verifySignature(payload, signature, razorpayConfig.getKeySecret());
        } catch (RazorpayException e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }

    /**
     * Verify payment and update payment status.
     * 
     * @param request Payment verification request
     * @return Updated payment entity
     */
    @Transactional
    public Payment verifyAndCompletePayment(PaymentVerificationRequest request) {
        log.info("Verifying payment for order: {}", request.getOrderId());

        // Find payment by Razorpay order ID
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new BadRequestException(
                        "Payment not found for Razorpay order: " + request.getRazorpayOrderId()));

        // Verify order ID matches
        if (!payment.getOrder().getId().equals(request.getOrderId())) {
            throw new BadRequestException("Order ID mismatch");
        }

        // Verify signature
        boolean isValid = verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature());

        if (!isValid) {
            log.error("Invalid payment signature for order: {}", request.getOrderId());
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Invalid payment signature");
            return paymentRepository.save(payment);
        }

        // Update payment details
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setTransactionId(request.getRazorpayPaymentId());
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());

        log.info("Payment verified successfully for order: {}", request.getOrderId());
        return paymentRepository.save(payment);
    }

    /**
     * Handle Razorpay webhook event.
     * 
     * @param payload   Webhook payload
     * @param signature Webhook signature
     * @return true if webhook was processed successfully
     */
    @Transactional
    public boolean handleWebhook(String payload, String signature) {
        log.info("Processing Razorpay webhook");

        try {
            // Verify webhook signature
            boolean isValid = Utils.verifyWebhookSignature(payload, signature, razorpayConfig.getWebhookSecret());
            if (!isValid) {
                log.error("Invalid webhook signature");
                return false;
            }

            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("event");

            log.info("Processing webhook event: {}", eventType);

            switch (eventType) {
                case "payment.authorized":
                    handlePaymentAuthorized(event);
                    break;
                case "payment.captured":
                    handlePaymentCaptured(event);
                    break;
                case "payment.failed":
                    handlePaymentFailed(event);
                    break;
                case "refund.created":
                    handleRefundCreated(event);
                    break;
                default:
                    log.info("Unhandled webhook event: {}", eventType);
            }

            return true;

        } catch (RazorpayException e) {
            log.error("Failed to process webhook", e);
            return false;
        }
    }

    private void handlePaymentAuthorized(JSONObject event) {
        JSONObject paymentEntity = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String razorpayOrderId = paymentEntity.getString("order_id");

        paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
            payment.setPaymentStatus(Payment.PaymentStatus.AUTHORIZED);
            payment.setRazorpayPaymentId(paymentEntity.getString("id"));
            paymentRepository.save(payment);
            log.info("Payment authorized for order: {}", payment.getOrder().getOrderNumber());
        });
    }

    private void handlePaymentCaptured(JSONObject event) {
        JSONObject paymentEntity = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String razorpayOrderId = paymentEntity.getString("order_id");

        paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
            payment.setPaymentStatus(Payment.PaymentStatus.CAPTURED);
            payment.setRazorpayPaymentId(paymentEntity.getString("id"));
            payment.setTransactionId(paymentEntity.getString("id"));
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Update order status
            Order order = payment.getOrder();
            order.setStatus(Order.OrderStatus.CONFIRMED);
            log.info("Payment captured for order: {}", order.getOrderNumber());
        });
    }

    private void handlePaymentFailed(JSONObject event) {
        JSONObject paymentEntity = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String razorpayOrderId = paymentEntity.getString("order_id");

        paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            if (paymentEntity.has("error_description")) {
                payment.setFailureReason(paymentEntity.getString("error_description"));
            }
            paymentRepository.save(payment);
            log.error("Payment failed for order: {}", payment.getOrder().getOrderNumber());
        });
    }

    private void handleRefundCreated(JSONObject event) {
        JSONObject refundEntity = event.getJSONObject("payload").getJSONObject("refund").getJSONObject("entity");
        String paymentId = refundEntity.getString("payment_id");

        paymentRepository.findByRazorpayPaymentId(paymentId).ifPresent(payment -> {
            payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
            payment.setRefundId(refundEntity.getString("id"));
            payment.setRefundAmount(BigDecimal.valueOf(refundEntity.getLong("amount")).divide(BigDecimal.valueOf(100)));
            payment.setRefundedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Update order status
            Order order = payment.getOrder();
            order.setStatus(Order.OrderStatus.REFUNDED);
            log.info("Refund processed for order: {}", order.getOrderNumber());
        });
    }

    /**
     * Get Razorpay key ID for frontend.
     */
    public String getKeyId() {
        return razorpayConfig.getKeyId();
    }

    /**
     * Get company name for payment description.
     */
    public String getCompanyName() {
        return razorpayConfig.getCompanyName();
    }

    /**
     * Get currency.
     */
    public String getCurrency() {
        return razorpayConfig.getCurrency();
    }

    /**
     * Initiate refund for a payment.
     * 
     * @param paymentId Payment entity ID
     * @param amount    Amount to refund (null for full refund)
     * @return Updated payment entity
     */
    @Transactional
    public Payment initiateRefund(UUID paymentId, BigDecimal amount) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BadRequestException("Payment not found"));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.COMPLETED &&
                payment.getPaymentStatus() != Payment.PaymentStatus.CAPTURED) {
            throw new BadRequestException("Payment cannot be refunded in current state: " + payment.getPaymentStatus());
        }

        try {
            BigDecimal refundAmount = amount != null ? amount : payment.getAmount();
            long refundAmountInPaise = refundAmount.multiply(BigDecimal.valueOf(100)).longValue();

            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", refundAmountInPaise);
            refundRequest.put("speed", "normal");
            refundRequest.put("notes", new JSONObject()
                    .put("order_id", payment.getOrder().getId().toString())
                    .put("reason", "Customer requested refund"));

            com.razorpay.Refund refund = razorpayClient.payments.refund(payment.getRazorpayPaymentId(), refundRequest);

            payment.setPaymentStatus(Payment.PaymentStatus.REFUND_PENDING);
            payment.setRefundId(refund.get("id"));
            payment.setRefundAmount(refundAmount);

            log.info("Refund initiated for payment: {} amount: {}", paymentId, refundAmount);
            return paymentRepository.save(payment);

        } catch (RazorpayException e) {
            log.error("Failed to initiate refund for payment: {}", paymentId, e);
            throw new BadRequestException("Failed to initiate refund: " + e.getMessage());
        }
    }
}
