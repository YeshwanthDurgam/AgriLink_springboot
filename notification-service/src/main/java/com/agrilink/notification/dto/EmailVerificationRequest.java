package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for email verification email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Verification link is required")
    private String verificationLink;

    private int expiryHours = 24; // default 24 hours
}
