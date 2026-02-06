package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.FarmerProfileDto;
import com.agrilink.user.dto.FarmerProfileRequest;
import com.agrilink.user.dto.ProfileApprovalRequest;
import com.agrilink.user.service.FarmerProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for farmer profile operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/profiles/farmer")
@RequiredArgsConstructor
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get current farmer's profile.
     * GET /api/v1/profiles/farmer
     * Security: Handled by SecurityConfig - FARMER role required
     */
    @GetMapping
    public ResponseEntity<ApiResponse<FarmerProfileDto>> getProfile(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        FarmerProfileDto profile = farmerProfileService.getOrCreateProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Update current farmer's profile.
     * PUT /api/v1/profiles/farmer
     * Security: Handled by SecurityConfig - FARMER role required (NO verification check)
     */
    @PutMapping
    public ResponseEntity<ApiResponse<FarmerProfileDto>> updateProfile(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody FarmerProfileRequest profileRequest) {
        
        // Enhanced logging for debugging 403 issues
        log.info("[ProfileUpdate] ========================================");
        log.info("[ProfileUpdate] Auth principal: {}", authentication != null ? authentication.getName() : "NULL");
        log.info("[ProfileUpdate] Auth authorities: {}", authentication != null ? authentication.getAuthorities() : "NULL");
        log.info("[ProfileUpdate] Request userId attr: {}", request.getAttribute("userId"));
        log.info("[ProfileUpdate] Fields: name={}, phone={}, farmName={}, city={}, state={}",
                profileRequest.getName(),
                profileRequest.getPhone(),
                profileRequest.getFarmName(),
                profileRequest.getCity(),
                profileRequest.getState());
        log.info("[ProfileUpdate] Has document: {}", profileRequest.getVerificationDocument() != null && !profileRequest.getVerificationDocument().isBlank());
        log.info("[ProfileUpdate] ========================================");
        
        UUID userId = getUserIdFromRequest(request, authentication);
        log.info("Resolved userId: {}", userId);
        
        FarmerProfileDto profile = farmerProfileService.updateProfile(userId, profileRequest);
        log.info("Profile updated successfully for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    /**
     * Check if farmer is approved.
     * GET /api/v1/profiles/farmer/status
     * Security: Handled by SecurityConfig - FARMER role required
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Boolean>> isApproved(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        boolean approved = farmerProfileService.isApproved(userId);
        return ResponseEntity.ok(ApiResponse.success(approved));
    }

    /**
     * Get pending farmer profiles (Manager/Admin only).
     * GET /api/v1/profiles/farmer/pending
     * Security: Handled by SecurityConfig - MANAGER or ADMIN role required
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<FarmerProfileDto>>> getPendingProfiles(Pageable pageable) {
        Page<FarmerProfileDto> profiles = farmerProfileService.getPendingProfiles(pageable);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    /**
     * Approve or reject a farmer profile (Manager/Admin only).
     * POST /api/v1/profiles/farmer/{farmerId}/approve
     * Security: Handled by SecurityConfig - MANAGER or ADMIN role required
     */
    @PostMapping("/{farmerId}/approve")
    public ResponseEntity<ApiResponse<FarmerProfileDto>> approveOrRejectProfile(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmerId,
            @Valid @RequestBody ProfileApprovalRequest approvalRequest) {
        UUID approverUserId = getUserIdFromRequest(request, authentication);
        FarmerProfileDto profile = farmerProfileService.approveOrRejectProfile(farmerId, approvalRequest, approverUserId);
        String message = approvalRequest.isApproved() ? "Farmer profile approved" : "Farmer profile rejected";
        return ResponseEntity.ok(ApiResponse.success(message, profile));
    }

    /**
     * Get farmer profile by ID (Manager/Admin only).
     * GET /api/v1/profiles/farmer/{farmerId}
     * Security: Handled by SecurityConfig - MANAGER or ADMIN role required
     */
    @GetMapping("/{farmerId}")
    public ResponseEntity<ApiResponse<FarmerProfileDto>> getProfileById(@PathVariable UUID farmerId) {
        FarmerProfileDto profile = farmerProfileService.getProfile(farmerId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Get pending farmer count (Manager/Admin only).
     * GET /api/v1/profiles/farmer/pending/count
     * Security: Handled by SecurityConfig - MANAGER or ADMIN role required
     */
    @GetMapping("/pending/count")
    public ResponseEntity<ApiResponse<Long>> getPendingCount() {
        long count = farmerProfileService.getPendingCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Get all approved farmers (public endpoint for farmers listing).
     * GET /api/v1/profiles/farmer/approved
     */
    @GetMapping("/approved")
    public ResponseEntity<ApiResponse<List<FarmerProfileDto>>> getApprovedFarmers() {
        List<FarmerProfileDto> farmers = farmerProfileService.getApprovedFarmers();
        return ResponseEntity.ok(ApiResponse.success(farmers));
    }

    /**
     * Approve all pending farmers (development/testing only).
     * POST /api/v1/profiles/farmer/approve-all
     */
    @PostMapping("/approve-all")
    public ResponseEntity<ApiResponse<Integer>> approveAllPendingFarmers() {
        int count = farmerProfileService.approveAllPending();
        return ResponseEntity.ok(ApiResponse.success("Approved " + count + " farmers", count));
    }
}
