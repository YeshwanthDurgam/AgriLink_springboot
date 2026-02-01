package com.agrilink.auth.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for communicating with the Notification Service.
 * Used to send email notifications when users register, reset password, etc.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://notification-service:8087}")
    private String notificationServiceUrl;

    /**
     * Send welcome email to newly registered user.
     */
    @Async
    public void sendWelcomeEmail(String email, String name) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/welcome";

            Map<String, String> request = new HashMap<>();
            request.put("email", email);
            request.put("name", name);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Welcome email request sent for: {}", email);
        } catch (Exception e) {
            log.error("Failed to send welcome email request for {}: {}", email, e.getMessage());
            // Don't throw - email is not critical for registration
        }
    }

    /**
     * Send password reset email.
     */
    @Async
    public void sendPasswordResetEmail(String email, String name, String resetLink, int expiryMinutes) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/password-reset";

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("name", name);
            request.put("resetLink", resetLink);
            request.put("expiryMinutes", expiryMinutes);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Password reset email request sent for: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email request for {}: {}", email, e.getMessage());
        }
    }

    /**
     * Send email verification email.
     */
    @Async
    public void sendEmailVerificationEmail(String email, String name, String verificationLink, int expiryHours) {
        try {
            String url = notificationServiceUrl + "/api/v1/emails/email-verification";

            Map<String, Object> request = new HashMap<>();
            request.put("email", email);
            request.put("name", name);
            request.put("verificationLink", verificationLink);
            request.put("expiryHours", expiryHours);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            restTemplate.postForEntity(url, entity, String.class);
            log.info("Email verification request sent for: {}", email);
        } catch (Exception e) {
            log.error("Failed to send email verification request for {}: {}", email, e.getMessage());
        }
    }
}
