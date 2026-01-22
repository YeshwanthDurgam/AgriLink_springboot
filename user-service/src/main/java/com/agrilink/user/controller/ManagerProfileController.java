package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.ManagerProfileDto;
import com.agrilink.user.dto.ManagerProfileRequest;
import com.agrilink.user.dto.ProfileApprovalRequest;
import com.agrilink.user.service.ManagerProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for manager profile operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/profiles/manager")
@RequiredArgsConstructor
public class ManagerProfileController {

    private final ManagerProfileService managerProfileService;

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get current manager's profile.
     * GET /api/v1/profiles/manager
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ManagerProfileDto>> getProfile(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        ManagerProfileDto profile = managerProfileService.getOrCreateProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Update current manager's profile.
     * PUT /api/v1/profiles/manager
     */
    @PutMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ManagerProfileDto>> updateProfile(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody ManagerProfileRequest profileRequest) {
        UUID userId = getUserIdFromRequest(request, authentication);
        ManagerProfileDto profile = managerProfileService.updateProfile(userId, profileRequest);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    /**
     * Check if manager is approved.
     * GET /api/v1/profiles/manager/status
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Boolean>> isApproved(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        boolean approved = managerProfileService.isApproved(userId);
        return ResponseEntity.ok(ApiResponse.success(approved));
    }

    /**
     * Get pending manager profiles (Admin only).
     * GET /api/v1/profiles/manager/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ManagerProfileDto>>> getPendingProfiles(Pageable pageable) {
        Page<ManagerProfileDto> profiles = managerProfileService.getPendingProfiles(pageable);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    /**
     * Approve or reject a manager profile (Admin only).
     * POST /api/v1/profiles/manager/{managerId}/approve
     */
    @PostMapping("/{managerId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ManagerProfileDto>> approveOrRejectProfile(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID managerId,
            @Valid @RequestBody ProfileApprovalRequest approvalRequest) {
        UUID approverUserId = getUserIdFromRequest(request, authentication);
        ManagerProfileDto profile = managerProfileService.approveOrRejectProfile(managerId, approvalRequest, approverUserId);
        String message = approvalRequest.isApproved() ? "Manager profile approved" : "Manager profile rejected";
        return ResponseEntity.ok(ApiResponse.success(message, profile));
    }

    /**
     * Get manager profile by ID (Admin only).
     * GET /api/v1/profiles/manager/{managerId}
     */
    @GetMapping("/{managerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ManagerProfileDto>> getProfileById(@PathVariable UUID managerId) {
        ManagerProfileDto profile = managerProfileService.getProfile(managerId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Get pending manager count (Admin only).
     * GET /api/v1/profiles/manager/pending/count
     */
    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getPendingCount() {
        long count = managerProfileService.getPendingCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
