package com.agrilink.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * DTO for user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String email;
    private String name;
    private String phone;
    private Set<String> roles;
    private boolean enabled;
    private boolean profileComplete;
    private String profileStatus;
    private LocalDateTime createdAt;
}
