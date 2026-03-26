package com.agrilink.user.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.user.dto.UserProfileDto;
import com.agrilink.user.service.AdminUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for admin user management operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * Helper method to get user ID from JWT token.
     */
    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Get all users with pagination.
     * GET /api/v1/admin/users?page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileDto>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role) {
        
        log.info("Admin fetching all users - page: {}, size: {}, role: {}", page, size, role);
        
        Page<UserProfileDto> users;
        if (StringUtils.hasText(role)) {
            users = adminUserService.getUsersByRole(role, page, size);
        } else {
            users = adminUserService.getAllUsers(page, size);
        }

        PagedResponse<UserProfileDto> response = PagedResponse.<UserProfileDto>builder()
                .content(users.getContent())
                .totalPages(users.getTotalPages())
                .totalElements(users.getTotalElements())
                    .page(users.getNumber())
                    .size(users.getSize())
                    .first(users.isFirst())
                    .last(users.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", response));
    }

    /**
     * Get user by ID.
     * GET /api/v1/admin/users/{userId}
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> getUser(
            @PathVariable UUID userId) {
        
        log.info("Admin fetching user: {}", userId);
        
        UserProfileDto user = adminUserService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Suspend/disable a user account.
     * PUT /api/v1/admin/users/{userId}/suspend
     */
    @PutMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> suspendUser(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID userId,
            @RequestParam(required = false) String reason) {
        
        UUID adminId = getUserIdFromRequest(request, authentication);
        log.info("Admin {} suspending user {}", adminId, userId);
        
        String authorizationHeader = request.getHeader("Authorization");
        UserProfileDto user = adminUserService.suspendUser(userId, reason, authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success("User suspended successfully", user));
    }

    /**
     * Activate/enable a user account.
     * PUT /api/v1/admin/users/{userId}/activate
     */
    @PutMapping("/{userId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> activateUser(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID userId) {
        
        UUID adminId = getUserIdFromRequest(request, authentication);
        log.info("Admin {} activating user {}", adminId, userId);
        
        String authorizationHeader = request.getHeader("Authorization");
        UserProfileDto user = adminUserService.activateUser(userId, authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }

    /**
     * Delete a user account (soft delete by marking as disabled and removing sensitive data).
     * DELETE /api/v1/admin/users/{userId}
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID userId,
            @RequestParam(required = false) String reason) {
        
        UUID adminId = getUserIdFromRequest(request, authentication);
        log.info("Admin {} deleting user {}", adminId, userId);
        
        String authorizationHeader = request.getHeader("Authorization");
        adminUserService.deleteUser(userId, reason, authorizationHeader);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("User account deleted successfully"));
    }

    /**
     * Get user status (enabled/disabled).
     * GET /api/v1/admin/users/{userId}/status
     */
    @GetMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> getUserStatus(
            @PathVariable UUID userId) {
        
        log.info("Fetching status for user: {}", userId);
        
        Object statusInfo = adminUserService.getUserStatus(userId);
        return ResponseEntity.ok(ApiResponse.success(statusInfo));
    }
}
