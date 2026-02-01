package com.agrilink.auth.controller;

import com.agrilink.auth.dto.*;
import com.agrilink.auth.service.AuthService;
import com.agrilink.auth.service.PasswordResetService;
import com.agrilink.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for authentication endpoints.
 * Handles user registration, login, password reset, and current user info.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    /**
     * Register a new user.
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request for email: {}", request.getEmail());
        UserDto user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", user));
    }

    /**
     * Authenticate user and return JWT token.
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for email: {}", request.getEmail());
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * Get current authenticated user details.
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UserDto user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Get all farmers (public endpoint).
     * Returns all users with FARMER role who are enabled (can login).
     * GET /api/v1/auth/farmers
     */
    @GetMapping("/farmers")
    public ResponseEntity<ApiResponse<List<UserDto>>> getFarmers() {
        log.info("Fetching all farmers");
        List<UserDto> farmers = authService.getFarmers();
        return ResponseEntity.ok(ApiResponse.success(farmers));
    }

    /**
     * Get all farmer IDs (public endpoint).
     * Returns IDs of all users with FARMER role who are enabled.
     * GET /api/v1/auth/farmers/ids
     */
    @GetMapping("/farmers/ids")
    public ResponseEntity<ApiResponse<List<UUID>>> getFarmerIds() {
        log.info("Fetching all farmer IDs");
        List<UUID> farmerIds = authService.getFarmerIds();
        return ResponseEntity.ok(ApiResponse.success(farmerIds));
    }

    /**
     * Request password reset - sends email with reset link.
     * POST /api/v1/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request for email: {}", request.getEmail());
        passwordResetService.processForgotPassword(request);
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(ApiResponse
                .success("If your email is registered, you will receive a password reset link shortly", null));
    }

    /**
     * Validate password reset token.
     * GET /api/v1/auth/validate-reset-token?token=xxx
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateResetToken(@RequestParam String token) {
        log.info("Validating reset token");
        boolean valid = passwordResetService.validateToken(token);
        return ResponseEntity.ok(ApiResponse.success(Map.of("valid", valid)));
    }

    /**
     * Reset password using token.
     * POST /api/v1/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request");
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse
                .success("Password has been reset successfully. You can now log in with your new password.", null));
    }
}
