package com.agrilink.user.dto;

import com.agrilink.user.entity.ProfileStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for customer profile data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileDto {
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
    private ProfileStatus status;
    private boolean profileComplete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
