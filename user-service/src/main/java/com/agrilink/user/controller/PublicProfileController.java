package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.PublicProfileDto;
import com.agrilink.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for public user profile information.
 * These endpoints don't require authentication and return limited public data.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users/public")
@RequiredArgsConstructor
public class PublicProfileController {

    private final UserProfileService userProfileService;

    /**
     * Get public profile by user ID.
     * GET /api/v1/users/public/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<PublicProfileDto>> getPublicProfile(@PathVariable UUID userId) {
        log.info("Fetching public profile for user: {}", userId);
        PublicProfileDto profile = userProfileService.getPublicProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Get public profiles for multiple users (batch).
     * POST /api/v1/users/public/batch
     */
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<PublicProfileDto>>> getPublicProfiles(@RequestBody List<UUID> userIds) {
        log.info("Fetching public profiles for {} users", userIds.size());
        List<PublicProfileDto> profiles = userProfileService.getPublicProfiles(userIds);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }
}
