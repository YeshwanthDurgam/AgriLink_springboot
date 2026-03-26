package com.agrilink.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * SMS Service for sending text messages.
 * Mock implementation - integrate with Twilio/AWS SNS in production.
 */
@Slf4j
@Service
public class SmsService {

    @Value("${notification.sms.enabled}")
    private boolean smsEnabled;

    @Value("${notification.sms.provider}")
    private String smsProvider;

    @Value("${notification.sms.textbelt.key:textbelt_test}")
    private String textbeltKey;

    /**
     * Send an SMS asynchronously.
     */
    @Async
    public void sendSms(String phoneNumber, String message) {
        try {
            sendSmsOrThrow(phoneNumber, message);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }

    public void sendSmsOrThrow(String phoneNumber, String message) {
        if (!smsEnabled) {
            throw new IllegalStateException("SMS_DISABLED");
        }

        log.info("Sending SMS to {} via {}", phoneNumber, smsProvider);
        switch (smsProvider.toLowerCase()) {
            case "textbelt" -> sendViaTextbelt(phoneNumber, message);
            default -> throw new IllegalStateException("UNSUPPORTED_SMS_PROVIDER: " + smsProvider);
        }

        log.info("SMS sent successfully to {}", phoneNumber);
    }

    private void sendViaTextbelt(String phoneNumber, String message) {
        if (textbeltKey == null || textbeltKey.isBlank()) {
            throw new IllegalStateException("TEXTBELT_KEY_MISSING");
        }

        Map<String, Object> response = WebClient.builder()
                .baseUrl("https://textbelt.com")
                .build()
                .post()
                .uri("/text")
                .body(BodyInserters.fromFormData("phone", phoneNumber)
                        .with("message", message)
                        .with("key", textbeltKey))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Object successValue = response != null ? response.get("success") : null;
        boolean success = Boolean.TRUE.equals(successValue);
        if (!success) {
            String error = response != null && response.get("error") != null
                    ? response.get("error").toString()
                    : "unknown error";
            throw new RuntimeException("TEXTBELT_SEND_FAILED: " + error);
        }
    }

    /**
     * Send OTP via SMS.
     */
    @Async
    public void sendOtp(String phoneNumber, String otp) {
        String message = String.format("Your AgriLink verification code is: %s. Valid for 10 minutes.", otp);
        sendSms(phoneNumber, message);
    }

    /**
     * Send order update SMS.
     */
    @Async
    public void sendOrderUpdateSms(String phoneNumber, String orderNumber, String status) {
        String message = String.format("AgriLink: Order %s status updated to %s", orderNumber, status);
        sendSms(phoneNumber, message);
    }
}
