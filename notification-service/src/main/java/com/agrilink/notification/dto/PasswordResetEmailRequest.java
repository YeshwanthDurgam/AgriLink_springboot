package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for password reset email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Reset link is required")
    private String resetLink;

    private int expiryMinutes = 60; // default 60 minutes
}
