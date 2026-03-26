package com.agrilink.user.service;

import com.agrilink.user.client.AuthAdminClient;
import com.agrilink.user.dto.UserProfileDto;
import com.agrilink.user.entity.UserProfile;
import com.agrilink.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for admin user management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserService {

    private final UserProfileRepository userProfileRepository;
    private final AuthAdminClient authAdminClient;

    /**
     * Get all users with pagination.
     */
    public Page<UserProfileDto> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return userProfileRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    /**
     * Get users by role.
     */
    public Page<UserProfileDto> getUsersByRole(String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return userProfileRepository.findByRole(role, pageable)
                .map(this::convertToDto);
    }

    /**
     * Get user by ID.
     */
    public UserProfileDto getUserById(UUID userId) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return convertToDto(userProfile);
    }

    /**
     * Suspend (disable) a user account.
     */
    public UserProfileDto suspendUser(UUID userId, String reason, String authorizationHeader) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        authAdminClient.suspendUser(userId, authorizationHeader);

        userProfile.setActive(false);
        userProfile.setSuspensionReason(reason != null ? reason : "Account suspended by admin");
        userProfile.setSuspendedAt(LocalDateTime.now());
        
        log.info("User {} suspended - Reason: {}", userId, reason);
        
        UserProfile updatedProfile = userProfileRepository.save(userProfile);
        return convertToDto(updatedProfile);
    }

    /**
     * Activate (enable) a user account.
     */
    public UserProfileDto activateUser(UUID userId, String authorizationHeader) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        authAdminClient.activateUser(userId, authorizationHeader);

        userProfile.setActive(true);
        userProfile.setSuspensionReason(null);
        userProfile.setSuspendedAt(null);
        
        log.info("User {} activated", userId);
        
        UserProfile updatedProfile = userProfileRepository.save(userProfile);
        return convertToDto(updatedProfile);
    }

    /**
     * Delete a user account (soft delete - disable and anonymize).
     */
    public void deleteUser(UUID userId, String reason, String authorizationHeader) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        authAdminClient.disableUser(userId, authorizationHeader);

        // Soft delete: disable account and anonymize data
        userProfile.setActive(false);
        userProfile.setFirstName("Deleted User");
        userProfile.setLastName("");
        userProfile.setPhoneNumber(null);
        userProfile.setCity(null);
        userProfile.setState(null);
        userProfile.setAddress(null);
        userProfile.setProfilePhoto(null);
        userProfile.setDeletedAt(LocalDateTime.now());
        userProfile.setDeletionReason(reason != null ? reason : "User requested account deletion");
        
        log.info("User {} deleted - Reason: {}", userId, reason);
        
        userProfileRepository.save(userProfile);
    }

    /**
     * Get user account status.
     */
    public Object getUserStatus(UUID userId) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Map<String, Object> status = new HashMap<>();
        status.put("userId", userProfile.getId());
        status.put("email", userProfile.getEmail());
        status.put("isActive", userProfile.isActive());
        status.put("suspensionReason", userProfile.getSuspensionReason());
        status.put("suspendedAt", userProfile.getSuspendedAt());
        status.put("deletedAt", userProfile.getDeletedAt());
        status.put("createdAt", userProfile.getCreatedAt());
        
        return status;
    }

    /**
     * Convert UserProfile entity to DTO.
     */
    private UserProfileDto convertToDto(UserProfile userProfile) {
        return UserProfileDto.builder()
                .id(userProfile.getId())
                .email(userProfile.getEmail())
                .firstName(userProfile.getFirstName())
                .lastName(userProfile.getLastName())
                .phoneNumber(userProfile.getPhoneNumber())
                .role(userProfile.getRole())
                .city(userProfile.getCity())
                .state(userProfile.getState())
                .address(userProfile.getAddress())
                .profilePhoto(userProfile.getProfilePhoto())
                .isActive(userProfile.isActive())
                .createdAt(userProfile.getCreatedAt())
                .updatedAt(userProfile.getUpdatedAt())
                .build();
    }
}
