package com.agrilink.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for receiving public profile data from user-service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPublicProfileDto {
    private UUID userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String city;
    private String state;
    private String profilePictureUrl;
}
