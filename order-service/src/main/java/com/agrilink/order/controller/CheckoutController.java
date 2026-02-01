package com.agrilink.order.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.order.dto.*;
import com.agrilink.order.service.CheckoutService;
import com.agrilink.order.service.RazorpayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for checkout and payment operations.
 * Implements Amazon-like checkout flow with Razorpay integration.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final RazorpayService razorpayService;

    /**
     * Helper method to get user ID from JWT token stored in request attribute.
     */
    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get checkout summary (cart totals with shipping and tax).
     * GET /api/v1/checkout/summary
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('BUYER') or hasRole('FARMER') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CheckoutSummary>> getCheckoutSummary(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        CheckoutSummary summary = checkoutService.getCheckoutSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Initialize checkout - create order and Razorpay payment order.
     * POST /api/v1/checkout/initialize
     */
    @PostMapping("/initialize")
    @PreAuthorize("hasRole('BUYER') or hasRole('FARMER') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CheckoutResponse>> initializeCheckout(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody CheckoutRequest checkoutRequest,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String customerPhone) {

        UUID userId = getUserIdFromRequest(request, authentication);

        // Use authentication details if not provided
        String email = customerEmail != null ? customerEmail : authentication.getName();
        String name = customerName != null ? customerName : checkoutRequest.getFullName();
        String phone = customerPhone != null ? customerPhone : checkoutRequest.getPhoneNumber();

        CheckoutResponse response = checkoutService.initializeCheckout(
                userId, checkoutRequest, email, name, phone);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Checkout initialized successfully", response));
    }

    /**
     * Verify payment and complete checkout.
     * POST /api/v1/checkout/verify-payment
     */
    @PostMapping("/verify-payment")
    @PreAuthorize("hasRole('BUYER') or hasRole('FARMER') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> verifyPayment(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody PaymentVerificationRequest verificationRequest) {

        UUID userId = getUserIdFromRequest(request, authentication);
        PaymentVerificationResponse response = checkoutService.completeCheckout(verificationRequest, userId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
        } else {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Payment verification failed", response));
        }
    }

    /**
     * Handle Razorpay webhook events.
     * POST /api/v1/checkout/webhook
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Received Razorpay webhook");

        boolean processed = razorpayService.handleWebhook(payload, signature);

        if (processed) {
            return ResponseEntity.ok("Webhook processed successfully");
        } else {
            return ResponseEntity.badRequest().body("Failed to process webhook");
        }
    }

    /**
     * Get Razorpay configuration for frontend.
     * GET /api/v1/checkout/razorpay-config
     */
    @GetMapping("/razorpay-config")
    public ResponseEntity<ApiResponse<RazorpayConfigResponse>> getRazorpayConfig() {
        RazorpayConfigResponse config = RazorpayConfigResponse.builder()
                .keyId(razorpayService.getKeyId())
                .currency(razorpayService.getCurrency())
                .companyName(razorpayService.getCompanyName())
                .build();
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    /**
     * DTO for Razorpay config response.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RazorpayConfigResponse {
        private String keyId;
        private String currency;
        private String companyName;
    }
}
