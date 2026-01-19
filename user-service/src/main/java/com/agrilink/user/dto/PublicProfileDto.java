package com.agrilink.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for public profile information (no sensitive data).
 * Used by other services to get basic user info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileDto {

    private UUID userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String city;
    private String state;
    private String profilePictureUrl;
}
