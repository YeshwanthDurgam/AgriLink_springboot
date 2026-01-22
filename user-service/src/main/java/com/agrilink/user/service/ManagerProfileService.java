package com.agrilink.user.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.user.dto.ManagerProfileDto;
import com.agrilink.user.dto.ManagerProfileRequest;
import com.agrilink.user.dto.ProfileApprovalRequest;
import com.agrilink.user.entity.ManagerProfile;
import com.agrilink.user.entity.ProfileStatus;
import com.agrilink.user.repository.ManagerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for manager profile operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManagerProfileService {

    private final ManagerProfileRepository managerProfileRepository;

    /**
     * Get or create manager profile for a user.
     */
    @Transactional
    public ManagerProfileDto getOrCreateProfile(UUID userId) {
        ManagerProfile profile = managerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new manager profile for user: {}", userId);
                    ManagerProfile newProfile = ManagerProfile.builder()
                            .userId(userId)
                            .status(ProfileStatus.PENDING)
                            .build();
                    return managerProfileRepository.save(newProfile);
                });
        return mapToDto(profile);
    }

    /**
     * Get manager profile by user ID.
     */
    @Transactional(readOnly = true)
    public ManagerProfileDto getProfile(UUID userId) {
        ManagerProfile profile = managerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager profile", "userId", userId));
        return mapToDto(profile);
    }

    /**
     * Update manager profile.
     */
    @Transactional
    public ManagerProfileDto updateProfile(UUID userId, ManagerProfileRequest request) {
        ManagerProfile profile = managerProfileRepository.findByUserId(userId)
                .orElseGet(() -> ManagerProfile.builder().userId(userId).status(ProfileStatus.PENDING).build());

        // Check username uniqueness
        if (request.getUsername() != null && !request.getUsername().equals(profile.getUsername())) {
            if (managerProfileRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestException("Username is already taken");
            }
        }

        // Update fields
        if (request.getName() != null) profile.setName(request.getName());
        if (request.getUsername() != null) profile.setUsername(request.getUsername());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAge() != null) profile.setAge(request.getAge());
        if (request.getProfilePhoto() != null) profile.setProfilePhoto(request.getProfilePhoto());
        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getState() != null) profile.setState(request.getState());
        if (request.getCountry() != null) profile.setCountry(request.getCountry());

        // If profile was rejected and is now being updated, set back to pending
        if (profile.getStatus() == ProfileStatus.REJECTED) {
            profile.setStatus(ProfileStatus.PENDING);
            profile.setRejectionReason(null);
        }

        ManagerProfile savedProfile = managerProfileRepository.save(profile);
        log.info("Updated manager profile for user: {}", userId);
        return mapToDto(savedProfile);
    }

    /**
     * Get all pending manager profiles.
     */
    @Transactional(readOnly = true)
    public Page<ManagerProfileDto> getPendingProfiles(Pageable pageable) {
        return managerProfileRepository.findByStatus(ProfileStatus.PENDING, pageable)
                .map(this::mapToDto);
    }

    /**
     * Approve or reject a manager profile (Admin only).
     */
    @Transactional
    public ManagerProfileDto approveOrRejectProfile(UUID managerId, ProfileApprovalRequest request, UUID approverUserId) {
        ManagerProfile profile = managerProfileRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager profile", "id", managerId));

        if (request.isApproved()) {
            profile.setStatus(ProfileStatus.APPROVED);
            profile.setApprovedBy(approverUserId);
            profile.setApprovedAt(LocalDateTime.now());
            profile.setRejectionReason(null);
            log.info("Approved manager profile: {}", managerId);
        } else {
            profile.setStatus(ProfileStatus.REJECTED);
            profile.setRejectionReason(request.getRejectionReason());
            profile.setApprovedBy(null);
            profile.setApprovedAt(null);
            log.info("Rejected manager profile: {} - Reason: {}", managerId, request.getRejectionReason());
        }

        return mapToDto(managerProfileRepository.save(profile));
    }

    /**
     * Check if manager is approved.
     */
    @Transactional(readOnly = true)
    public boolean isApproved(UUID userId) {
        return managerProfileRepository.findByUserId(userId)
                .map(ManagerProfile::isApproved)
                .orElse(false);
    }

    /**
     * Get count of pending manager profiles.
     */
    @Transactional(readOnly = true)
    public long getPendingCount() {
        return managerProfileRepository.countByStatus(ProfileStatus.PENDING);
    }

    /**
     * Get all managers by status.
     */
    @Transactional(readOnly = true)
    public List<ManagerProfileDto> getByStatus(ProfileStatus status) {
        return managerProfileRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ManagerProfileDto mapToDto(ManagerProfile profile) {
        return ManagerProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .name(profile.getName())
                .username(profile.getUsername())
                .phone(profile.getPhone())
                .age(profile.getAge())
                .profilePhoto(profile.getProfilePhoto())
                .city(profile.getCity())
                .state(profile.getState())
                .country(profile.getCountry())
                .status(profile.getStatus())
                .approvedBy(profile.getApprovedBy())
                .approvedAt(profile.getApprovedAt())
                .rejectionReason(profile.getRejectionReason())
                .profileComplete(profile.isProfileComplete())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
