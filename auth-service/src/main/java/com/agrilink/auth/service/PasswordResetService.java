package com.agrilink.auth.service;

import com.agrilink.auth.client.NotificationClient;
import com.agrilink.auth.dto.ForgotPasswordRequest;
import com.agrilink.auth.dto.ResetPasswordRequest;
import com.agrilink.auth.entity.PasswordResetToken;
import com.agrilink.auth.entity.User;
import com.agrilink.auth.repository.PasswordResetTokenRepository;
import com.agrilink.auth.repository.UserRepository;
import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for handling password reset operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationClient notificationClient;

    @Value("${app.password-reset.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Process forgot password request - generates token and sends email.
     * Always returns success to prevent email enumeration attacks.
     */
    @Transactional
    public void processForgotPassword(ForgotPasswordRequest request) {
        log.info("Processing forgot password request for email: {}", request.getEmail());

        // Find user - but don't reveal if email exists
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Invalidate any existing tokens for this user
            tokenRepository.invalidateUserTokens(user);

            // Generate new token
            String token = UUID.randomUUID().toString();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes))
                    .used(false)
                    .build();

            tokenRepository.save(resetToken);
            log.info("Password reset token generated for user: {}", user.getId());

            // Build reset link
            String resetLink = frontendUrl + "/reset-password?token=" + token;

            // Send email asynchronously
            String userName = user.getEmail().split("@")[0];
            notificationClient.sendPasswordResetEmail(
                    user.getEmail(),
                    userName,
                    resetLink,
                    tokenExpiryMinutes);
        });

        // Always log as if successful (security best practice)
        log.info("Forgot password request processed for: {}", request.getEmail());
    }

    /**
     * Validate if a token is valid (exists, not expired, not used).
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String token) {
        return tokenRepository.findValidToken(token, LocalDateTime.now()).isPresent();
    }

    /**
     * Reset password using the token.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset request");

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Find and validate token
        PasswordResetToken resetToken = tokenRepository.findValidToken(request.getToken(), LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        // Get user
        User user = resetToken.getUser();

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Invalidate all other tokens for this user
        tokenRepository.invalidateUserTokens(user);

        log.info("Password reset successful for user: {}", user.getId());
    }

    /**
     * Cleanup expired tokens - runs daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up {} expired password reset tokens", deleted);
    }
}
