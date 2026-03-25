package com.agrilink.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for creating a new farm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFarmRequest {

    @NotBlank(message = "Farm name is required")
    private String name;

    private String description;
    private String location;
    private String cropTypes;
    private String farmImageUrl;

    @Positive(message = "Total area must be positive")
    private BigDecimal totalArea;

    private String areaUnit;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
