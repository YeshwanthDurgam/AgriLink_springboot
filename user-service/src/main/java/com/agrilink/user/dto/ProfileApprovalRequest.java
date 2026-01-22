package com.agrilink.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Request DTO for approving or rejecting a profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileApprovalRequest {
    
    private boolean approved;
    
    private String rejectionReason;
}
