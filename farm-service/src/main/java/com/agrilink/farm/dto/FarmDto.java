package com.agrilink.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Farm information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmDto {

    private UUID id;
    private UUID farmerId;

    @NotBlank(message = "Farm name is required")
    @Size(max = 255, message = "Farm name must not exceed 255 characters")
    private String name;

    private String description;

    @Size(max = 500, message = "Location must not exceed 500 characters")
    private String location;

    private String cropTypes;
    private String farmImageUrl;

    @Positive(message = "Total area must be positive")
    private BigDecimal totalArea;

    private String areaUnit;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean active;
    private int fieldCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
