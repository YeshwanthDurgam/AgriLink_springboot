package com.agrilink.order.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Razorpay payment gateway.
 * Handles initialization gracefully even if credentials are invalid or missing.
 */
@Configuration
@Slf4j
@Getter
public class RazorpayConfig {

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key.secret:secret_placeholder}")
    private String keySecret;

    @Value("${razorpay.webhook.secret:webhook_secret}")
    private String webhookSecret;

    @Value("${app.currency:INR}")
    private String currency;

    @Value("${app.company.name:AgriLink}")
    private String companyName;

    /**
     * Determine if Razorpay is properly configured
     */
    public boolean isRazorpayConfigured() {
        boolean configured = keyId != null && !keyId.isEmpty() && !keyId.contains("placeholder") &&
                keySecret != null && !keySecret.isEmpty() && !keySecret.contains("placeholder");
        if (!configured) {
            log.warn("Razorpay credentials not properly configured. Using mock payment mode.");
        }
        return configured;
    }

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            if (!isRazorpayConfigured()) {
                log.warn("Razorpay API keys are incomplete or placeholder values. " + 
                         "Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file.");
                // Return null - RazorpayService will use mock payment handler
                return null;
            }
            
            log.info("Initializing Razorpay client with key: {}", 
                keyId.substring(0, Math.min(10, keyId.length())) + "...");
            return new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client with provided credentials. " +
                      "This might be due to invalid API keys. Error: {}", e.getMessage());
            log.warn("Falling back to mock payment mode. To enable real payments, " +
                     "configure valid Razorpay API keys in .env file.");
            return null;
        } catch (Exception e) {
            log.error("Unexpected error initializing Razorpay client: {}", e.getMessage(), e);
            return null;
        }
    }
}
