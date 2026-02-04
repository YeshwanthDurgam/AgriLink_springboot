package com.agrilink.farm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for farm onboarding during profile setup.
 * Used when a farmer completes their profile onboarding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmOnboardingRequest {

    @NotBlank(message = "Farm name is required")
    private String farmName;

    private String cropTypes;
    private String description;
    private String farmImageUrl;
    private String location;
    private String city;
    private String state;
}
