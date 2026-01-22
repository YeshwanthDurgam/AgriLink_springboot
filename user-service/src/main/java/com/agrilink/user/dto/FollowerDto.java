package com.agrilink.user.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for follower information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowerDto {
    private UUID userId;
    private String name;
    private String username;
    private String profilePhoto;
    private LocalDateTime followedAt;
}
