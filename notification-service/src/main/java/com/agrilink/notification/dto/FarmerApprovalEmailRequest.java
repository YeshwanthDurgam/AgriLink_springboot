package com.agrilink.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for farmer approval notification email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerApprovalEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Farmer name is required")
    private String farmerName;

    private boolean approved;

    private String rejectionReason; // only if not approved
}
