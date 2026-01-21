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

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        log.info("Initializing Razorpay client with key: {}", keyId.substring(0, Math.min(10, keyId.length())) + "...");
        return new RazorpayClient(keyId, keySecret);
    }
}
