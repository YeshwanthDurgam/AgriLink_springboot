package com.agrilink.notification.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.notification.dto.*;
import com.agrilink.notification.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API Controller for email notifications.
 * Used by other microservices to trigger email notifications.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    /**
     * Send welcome email to newly registered user.
     */
    @PostMapping("/welcome")
    public ResponseEntity<ApiResponse<String>> sendWelcomeEmail(
            @Valid @RequestBody WelcomeEmailRequest request) {
        log.info("Received welcome email request for: {}", request.getEmail());
        emailService.sendWelcomeEmail(request.getEmail(), request.getName());
        return ResponseEntity.ok(ApiResponse.success("Welcome email queued for " + request.getEmail()));
    }

    /**
     * Send order confirmation email.
     */
    @PostMapping("/order-confirmation")
    public ResponseEntity<ApiResponse<String>> sendOrderConfirmationEmail(
            @Valid @RequestBody OrderConfirmationEmailRequest request) {
        log.info("Received order confirmation email request for order: {}", request.getOrderNumber());

        // Convert DTO items to EmailService.OrderItemInfo
        List<EmailService.OrderItemInfo> items = java.util.Collections.emptyList();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            items = request.getItems().stream()
                    .map(item -> new EmailService.OrderItemInfo(
                            item.getName(),
                            item.getQuantity(),
                            item.getUnit(),
                            item.getUnitPrice(),
                            item.getSubtotal(),
                            item.getImageUrl()))
                    .collect(java.util.stream.Collectors.toList());
        }

        emailService.sendOrderConfirmationEmail(
                request.getEmail(),
                request.getCustomerName(),
                request.getOrderNumber(),
                request.getTotalAmount(),
                "INR", // Default currency
                items,
                request.getShippingAddress() != null ? request.getShippingAddress() : "");
        return ResponseEntity.ok(ApiResponse.success("Order confirmation email queued for " + request.getEmail()));
    }

    /**
     * Send order status update email.
     */
    @PostMapping("/order-status")
    public ResponseEntity<ApiResponse<String>> sendOrderStatusEmail(
            @Valid @RequestBody OrderStatusEmailRequest request) {
        log.info("Received order status email request for order: {}", request.getOrderNumber());
        emailService.sendOrderStatusEmail(
                request.getEmail(),
                request.getCustomerName(),
                request.getOrderNumber(),
                request.getStatus(),
                request.getStatusMessage() != null ? request.getStatusMessage()
                        : "Your order status has been updated.");
        return ResponseEntity.ok(ApiResponse.success("Order status email queued for " + request.getEmail()));
    }

    /**
     * Send password reset email.
     */
    @PostMapping("/password-reset")
    public ResponseEntity<ApiResponse<String>> sendPasswordResetEmail(
            @Valid @RequestBody PasswordResetEmailRequest request) {
        log.info("Received password reset email request for: {}", request.getEmail());
        // The EmailService expects a token, but we receive a link - extract or use as
        // token
        emailService.sendPasswordResetEmail(
                request.getEmail(),
                request.getName(),
                request.getResetLink()); // Using the link as the token
        return ResponseEntity.ok(ApiResponse.success("Password reset email queued for " + request.getEmail()));
    }

    /**
     * Send email verification email.
     */
    @PostMapping("/email-verification")
    public ResponseEntity<ApiResponse<String>> sendEmailVerificationEmail(
            @Valid @RequestBody EmailVerificationRequest request) {
        log.info("Received email verification request for: {}", request.getEmail());
        // The EmailService expects a token, but we receive a link - extract or use as
        // token
        emailService.sendEmailVerificationEmail(
                request.getEmail(),
                request.getName(),
                request.getVerificationLink()); // Using the link as the token
        return ResponseEntity.ok(ApiResponse.success("Verification email queued for " + request.getEmail()));
    }

    /**
     * Send farmer approval notification email.
     */
    @PostMapping("/farmer-approval")
    public ResponseEntity<ApiResponse<String>> sendFarmerApprovalEmail(
            @Valid @RequestBody FarmerApprovalEmailRequest request) {
        log.info("Received farmer approval email request for: {}", request.getEmail());
        emailService.sendFarmerApprovalEmail(
                request.getEmail(),
                request.getFarmerName(),
                request.isApproved(),
                request.getRejectionReason());
        return ResponseEntity.ok(ApiResponse.success("Farmer approval email queued for " + request.getEmail()));
    }

    /**
     * Send payment receipt email.
     */
    @PostMapping("/payment-receipt")
    public ResponseEntity<ApiResponse<String>> sendPaymentReceiptEmail(
            @Valid @RequestBody PaymentReceiptEmailRequest request) {
        log.info("Received payment receipt email request for order: {}", request.getOrderNumber());
        emailService.sendPaymentReceiptEmail(
                request.getEmail(),
                request.getCustomerName(),
                request.getOrderNumber(),
                request.getTransactionId(),
                request.getAmount(),
                "INR", // Default currency
                request.getPaymentMethod());
        return ResponseEntity.ok(ApiResponse.success("Payment receipt email queued for " + request.getEmail()));
    }

    /**
     * Send new message notification email.
     */
    @PostMapping("/new-message")
    public ResponseEntity<ApiResponse<String>> sendNewMessageEmail(
            @Valid @RequestBody NewMessageEmailRequest request) {
        log.info("Received new message notification request for: {}", request.getEmail());
        emailService.sendNewMessageEmail(
                request.getEmail(),
                request.getRecipientName(),
                request.getSenderName(),
                request.getMessagePreview() != null ? request.getMessagePreview() : "You have a new message");
        return ResponseEntity.ok(ApiResponse.success("New message email queued for " + request.getEmail()));
    }

    /**
     * Health check for email service.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("Email service is operational"));
    }
}
