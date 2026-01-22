package com.agrilink.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * DTO for authentication responses containing JWT token.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String type;
    private UUID userId;
    private String email;
    private String name;
    private Set<String> roles;
    private boolean profileComplete;
    private String profileStatus;
    private long expiresIn;

    public static AuthResponse of(String token, UUID userId, String email, String name, Set<String> roles, 
                                   boolean profileComplete, String profileStatus, long expiresIn) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(userId)
                .email(email)
                .name(name)
                .roles(roles)
                .profileComplete(profileComplete)
                .profileStatus(profileStatus)
                .expiresIn(expiresIn)
                .build();
    }
    
    // Backward compatible method
    public static AuthResponse of(String token, String email, Set<String> roles, long expiresIn) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .email(email)
                .roles(roles)
                .expiresIn(expiresIn)
                .build();
    }
}
