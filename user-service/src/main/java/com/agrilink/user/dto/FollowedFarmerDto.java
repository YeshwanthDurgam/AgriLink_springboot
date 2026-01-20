package com.agrilink.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for followed farmer information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowedFarmerDto {

    private UUID id;
    private UUID userId;
    private UUID farmerId;
    private LocalDateTime followedAt;
    
    // Optional farmer details (can be populated from auth-service)
    private String farmerName;
    private String farmerEmail;
    private String farmName;
    private String location;
    private String profilePictureUrl;
}
