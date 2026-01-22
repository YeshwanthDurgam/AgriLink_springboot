package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.FollowedFarmerDto;
import com.agrilink.user.dto.FollowerDto;
import com.agrilink.user.service.FollowedFarmerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for followed farmers operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/farmers")
@RequiredArgsConstructor
public class FollowedFarmerController {

    private final FollowedFarmerService followedFarmerService;

    /**
     * Helper method to get user ID from JWT token stored in request attribute.
     */
    private UUID getUserIdFromRequest(HttpServletRequest request) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        throw new IllegalStateException("User ID not found in request");
    }

    /**
     * Check if user has FARMER role.
     */
    private boolean isFarmer(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_FARMER"));
    }

    /**
     * Follow a farmer.
     * POST /api/v1/farmers/{farmerId}/follow
     */
    @PostMapping("/{farmerId}/follow")
    @PreAuthorize("hasRole('BUYER') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<FollowedFarmerDto>> followFarmer(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmerId) {
        
        // Additional check: farmers cannot follow other farmers
        if (isFarmer(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Farmers cannot follow other farmers"));
        }

        UUID userId = getUserIdFromRequest(request);
        FollowedFarmerDto result = followedFarmerService.followFarmer(userId, farmerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Successfully followed farmer", result));
    }

    /**
     * Unfollow a farmer.
     * DELETE /api/v1/farmers/{farmerId}/follow
     */
    @DeleteMapping("/{farmerId}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowFarmer(
            HttpServletRequest request,
            @PathVariable UUID farmerId) {
        UUID userId = getUserIdFromRequest(request);
        followedFarmerService.unfollowFarmer(userId, farmerId);
        return ResponseEntity.ok(ApiResponse.success("Successfully unfollowed farmer"));
    }

    /**
     * Get all farmers followed by the current user.
     * GET /api/v1/farmers/followed
     */
    @GetMapping("/followed")
    public ResponseEntity<ApiResponse<List<FollowedFarmerDto>>> getFollowedFarmers(
            HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        List<FollowedFarmerDto> followedFarmers = followedFarmerService.getFollowedFarmers(userId);
        return ResponseEntity.ok(ApiResponse.success(followedFarmers));
    }

    /**
     * Get farmer IDs followed by the current user.
     * GET /api/v1/farmers/followed/ids
     */
    @GetMapping("/followed/ids")
    public ResponseEntity<ApiResponse<List<UUID>>> getFollowedFarmerIds(
            HttpServletRequest request) {
        UUID userId = getUserIdFromRequest(request);
        List<UUID> farmerIds = followedFarmerService.getFollowedFarmerIds(userId);
        return ResponseEntity.ok(ApiResponse.success(farmerIds));
    }

    /**
     * Check if current user is following a specific farmer.
     * GET /api/v1/farmers/{farmerId}/following
     */
    @GetMapping("/{farmerId}/following")
    public ResponseEntity<ApiResponse<Boolean>> isFollowing(
            HttpServletRequest request,
            @PathVariable UUID farmerId) {
        UUID userId = getUserIdFromRequest(request);
        boolean isFollowing = followedFarmerService.isFollowing(userId, farmerId);
        return ResponseEntity.ok(ApiResponse.success(isFollowing));
    }

    /**
     * Get follower count for a farmer.
     * GET /api/v1/farmers/{farmerId}/followers/count
     * This is public - no authentication required.
     */
    @GetMapping("/{farmerId}/followers/count")
    public ResponseEntity<ApiResponse<Long>> getFollowerCount(@PathVariable UUID farmerId) {
        long count = followedFarmerService.getFollowerCount(farmerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Get all followers for the current farmer.
     * GET /api/v1/farmers/my/followers
     * Returns list of users following this farmer with their profile info.
     */
    @GetMapping("/my/followers")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<List<FollowerDto>>> getMyFollowers(HttpServletRequest request) {
        UUID farmerId = getUserIdFromRequest(request);
        List<FollowerDto> followers = followedFarmerService.getFollowersForFarmer(farmerId);
        return ResponseEntity.ok(ApiResponse.success(followers));
    }
}
