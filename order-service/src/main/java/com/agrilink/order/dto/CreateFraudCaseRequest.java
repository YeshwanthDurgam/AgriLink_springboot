package com.agrilink.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * Request DTO for creating a new fraud case.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFraudCaseRequest {

    @NotNull(message = "Accused user ID is required")
    private UUID accusedId;

    @NotNull(message = "Fraud type is required")
    private String fraudType;

    private UUID orderId;

    @NotBlank(message = "Description is required")
    private String description;

    private String evidenceDetails;

    @NotNull(message = "Priority is required")
    private String priority;
}
