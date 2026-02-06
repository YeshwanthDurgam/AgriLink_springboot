package com.agrilink.user.dto;

import com.agrilink.user.entity.ProfileStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for farmer profile data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerProfileDto {
    private UUID id;
    private UUID userId;
    private String name;
    private String username;
    private String phone;
    private Integer age;
    private String profilePhoto;
    private String city;
    private String state;
    private String country;
    private String address;
    private String pincode;
    private String farmName;
    private String cropTypes;
    private String farmPhoto;
    private String farmBio;
    private String certificates;
    private String verificationDocument;
    private LocalDateTime documentUploadedAt;
    private String documentType;
    private boolean hasDocument;
    private ProfileStatus status;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private boolean profileComplete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
