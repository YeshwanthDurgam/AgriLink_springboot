package com.agrilink.marketplace.dto;

import lombok.*;

/**
 * DTO for demand forecast request parameters.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandForecastRequest {
    
    private String cropType;
    private String district;
    private String state;
}
