package com.agrilink.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Client service to fetch user information from user-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private final WebClient userServiceWebClient;
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    /**
     * Get user's role by userId.
     * Returns FARMER, CUSTOMER, MANAGER, or ADMIN.
     */
    public String getUserRole(UUID userId) {
        try {
            Map<String, Object> response = userServiceWebClient
                    .get()
                    .uri("/api/v1/users/public/{userId}", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                if (data.get("role") != null) {
                    return data.get("role").toString();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch role for user {}: {}", userId, e.getMessage());
        }
        
        // Default to CUSTOMER if unable to determine
        return "CUSTOMER";
    }

    /**
     * Get user's display name by userId.
     */
    public String getUserName(UUID userId) {
        try {
            Map<String, Object> response = userServiceWebClient
                    .get()
                    .uri("/api/v1/users/public/{userId}", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                if (data.get("fullName") != null) {
                    return data.get("fullName").toString();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch name for user {}: {}", userId, e.getMessage());
        }
        
        return "User";
    }
}
