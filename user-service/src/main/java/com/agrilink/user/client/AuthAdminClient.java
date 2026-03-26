package com.agrilink.user.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * Client for auth-service admin account state operations.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthAdminClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public void suspendUser(UUID userId, String authorizationHeader) {
        callAuthAdminEndpoint(userId, "suspend", authorizationHeader);
    }

    public void activateUser(UUID userId, String authorizationHeader) {
        callAuthAdminEndpoint(userId, "activate", authorizationHeader);
    }

    public void disableUser(UUID userId, String authorizationHeader) {
        callAuthAdminEndpoint(userId, "disable", authorizationHeader);
    }

    private void callAuthAdminEndpoint(UUID userId, String action, String authorizationHeader) {
        String url = authServiceUrl + "/api/v1/auth/admin/users/" + userId + "/" + action;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    requestEntity,
                    String.class
            );
            log.info("Auth-service {} call succeeded for user {} with status {}", action, userId, response.getStatusCode());
        } catch (Exception ex) {
            log.error("Auth-service {} call failed for user {}: {}", action, userId, ex.getMessage());
            throw new RuntimeException("Failed to sync auth account state with auth-service", ex);
        }
    }
}
