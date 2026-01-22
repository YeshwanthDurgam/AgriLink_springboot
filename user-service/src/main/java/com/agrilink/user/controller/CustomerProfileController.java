package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.user.dto.CustomerProfileDto;
import com.agrilink.user.dto.CustomerProfileRequest;
import com.agrilink.user.service.CustomerProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for customer profile operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/profiles/customer")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final CustomerProfileService customerProfileService;

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get current customer's profile.
     * GET /api/v1/profiles/customer
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'BUYER')")
    public ResponseEntity<ApiResponse<CustomerProfileDto>> getProfile(
            HttpServletRequest request,
            Authentication authentication) {
        UUID userId = getUserIdFromRequest(request, authentication);
        CustomerProfileDto profile = customerProfileService.getOrCreateProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Update current customer's profile.
     * PUT /api/v1/profiles/customer
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'BUYER')")
    public ResponseEntity<ApiResponse<CustomerProfileDto>> updateProfile(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody CustomerProfileRequest profileRequest) {
        UUID userId = getUserIdFromRequest(request, authentication);
        CustomerProfileDto profile = customerProfileService.updateProfile(userId, profileRequest);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    /**
     * Get customer profile by user ID (Admin only).
     * GET /api/v1/profiles/customer/{userId}
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CustomerProfileDto>> getProfileByUserId(@PathVariable UUID userId) {
        CustomerProfileDto profile = customerProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
