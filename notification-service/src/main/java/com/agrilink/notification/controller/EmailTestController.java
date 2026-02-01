package com.agrilink.notification.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controller for testing email functionality.
 * NOTE: Remove or secure this in production!
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/email-test")
@RequiredArgsConstructor
public class EmailTestController {

    private final EmailService emailService;

    /**
     * Test welcome email.
     * POST /api/v1/email-test/welcome?to=email@example.com&name=User
     */
    @PostMapping("/welcome")
    public ResponseEntity<ApiResponse<String>> testWelcomeEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test User") String name) {
        log.info("Testing welcome email to: {}", to);
        emailService.sendWelcomeEmail(to, name);
        return ResponseEntity.ok(ApiResponse.success("Welcome email sent to " + to));
    }

    /**
     * Test order confirmation email.
     * POST /api/v1/email-test/order-confirmation
     */
    @PostMapping("/order-confirmation")
    public ResponseEntity<ApiResponse<String>> testOrderConfirmationEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test Customer") String customerName) {
        log.info("Testing order confirmation email to: {}", to);

        List<EmailService.OrderItemInfo> items = List.of(
                new EmailService.OrderItemInfo("Fresh Tomatoes", 2, "kg", BigDecimal.valueOf(50),
                        BigDecimal.valueOf(100), null),
                new EmailService.OrderItemInfo("Organic Spinach", 1, "kg", BigDecimal.valueOf(80),
                        BigDecimal.valueOf(80), null),
                new EmailService.OrderItemInfo("Farm Fresh Eggs", 12, "pcs", BigDecimal.valueOf(10),
                        BigDecimal.valueOf(120), null));

        emailService.sendOrderConfirmationEmail(
                to,
                customerName,
                "ORD-" + System.currentTimeMillis(),
                BigDecimal.valueOf(300),
                "₹",
                items,
                "123 Main Street, Bangalore, Karnataka 560001");

        return ResponseEntity.ok(ApiResponse.success("Order confirmation email sent to " + to));
    }

    /**
     * Test order status email.
     * POST /api/v1/email-test/order-status
     */
    @PostMapping("/order-status")
    public ResponseEntity<ApiResponse<String>> testOrderStatusEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test Customer") String customerName,
            @RequestParam(defaultValue = "SHIPPED") String status) {
        log.info("Testing order status email to: {} with status: {}", to, status);

        String statusMessage = switch (status.toUpperCase()) {
            case "CONFIRMED" -> "Your order has been confirmed and is being prepared.";
            case "PROCESSING" -> "Your order is being processed by the farmer.";
            case "SHIPPED" -> "Your order has been shipped and is on its way!";
            case "OUT_FOR_DELIVERY" -> "Your order is out for delivery. Get ready!";
            case "DELIVERED" -> "Your order has been delivered. Enjoy your fresh produce!";
            case "CANCELLED" -> "Your order has been cancelled.";
            default -> "Your order status has been updated.";
        };

        emailService.sendOrderStatusEmail(
                to,
                customerName,
                "ORD-" + System.currentTimeMillis(),
                status.toUpperCase(),
                statusMessage);

        return ResponseEntity.ok(ApiResponse.success("Order status email sent to " + to));
    }

    /**
     * Test password reset email.
     * POST /api/v1/email-test/password-reset
     */
    @PostMapping("/password-reset")
    public ResponseEntity<ApiResponse<String>> testPasswordResetEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test User") String name) {
        log.info("Testing password reset email to: {}", to);
        emailService.sendPasswordResetEmail(to, name, "sample-reset-token-" + System.currentTimeMillis());
        return ResponseEntity.ok(ApiResponse.success("Password reset email sent to " + to));
    }

    /**
     * Test farmer approval email.
     * POST /api/v1/email-test/farmer-approval
     */
    @PostMapping("/farmer-approval")
    public ResponseEntity<ApiResponse<String>> testFarmerApprovalEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test Farmer") String farmerName,
            @RequestParam(defaultValue = "true") boolean approved) {
        log.info("Testing farmer approval email to: {} approved: {}", to, approved);

        String reason = approved ? null : "Please provide valid farm registration documents.";
        emailService.sendFarmerApprovalEmail(to, farmerName, approved, reason);

        return ResponseEntity.ok(ApiResponse.success("Farmer approval email sent to " + to));
    }

    /**
     * Test payment receipt email.
     * POST /api/v1/email-test/payment-receipt
     */
    @PostMapping("/payment-receipt")
    public ResponseEntity<ApiResponse<String>> testPaymentReceiptEmail(
            @RequestParam String to,
            @RequestParam(defaultValue = "Test Customer") String customerName) {
        log.info("Testing payment receipt email to: {}", to);

        emailService.sendPaymentReceiptEmail(
                to,
                customerName,
                "ORD-" + System.currentTimeMillis(),
                "TXN-" + System.currentTimeMillis(),
                BigDecimal.valueOf(1500),
                "₹",
                "Razorpay");

        return ResponseEntity.ok(ApiResponse.success("Payment receipt email sent to " + to));
    }

    /**
     * Test all emails at once.
     * POST /api/v1/email-test/all
     */
    @PostMapping("/all")
    public ResponseEntity<ApiResponse<String>> testAllEmails(@RequestParam String to) {
        log.info("Testing ALL emails to: {}", to);

        testWelcomeEmail(to, "Test User");
        testOrderConfirmationEmail(to, "Test Customer");
        testOrderStatusEmail(to, "Test Customer", "SHIPPED");
        testPasswordResetEmail(to, "Test User");
        testFarmerApprovalEmail(to, "Test Farmer", true);
        testPaymentReceiptEmail(to, "Test Customer");

        return ResponseEntity.ok(ApiResponse.success("All test emails sent to " + to));
    }
}
