package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.UpdateProfileRequest;
import com.agrilink.user.dto.UserProfileDto;
import com.agrilink.user.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for user profile operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    /**
     * Helper method to get user ID from JWT token stored in request attribute.
     */
    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        // Fallback to generating UUID from email (for backward compatibility)
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get current user's profile.
     * GET /api/v1/users/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        UserProfileDto profile = userProfileService.getOrCreateProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Update current user's profile.
     * PUT /api/v1/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest updateRequest) {
        UUID userId = getUserIdFromRequest(request, authentication);
        UserProfileDto profile = userProfileService.updateProfile(userId, updateRequest);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    /**
     * Get profile by user ID (Admin only).
     * GET /api/v1/users/{userId}/profile
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfileByUserId(@PathVariable UUID userId) {
        UserProfileDto profile = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
