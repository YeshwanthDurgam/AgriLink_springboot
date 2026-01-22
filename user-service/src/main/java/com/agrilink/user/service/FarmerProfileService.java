package com.agrilink.user.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.user.dto.FarmerProfileDto;
import com.agrilink.user.dto.FarmerProfileRequest;
import com.agrilink.user.dto.ProfileApprovalRequest;
import com.agrilink.user.entity.FarmerProfile;
import com.agrilink.user.entity.ProfileStatus;
import com.agrilink.user.repository.FarmerProfileRepository;
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
 * Service for farmer profile operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FarmerProfileService {

    private final FarmerProfileRepository farmerProfileRepository;

    /**
     * Get or create farmer profile for a user.
     */
    @Transactional
    public FarmerProfileDto getOrCreateProfile(UUID userId) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new farmer profile for user: {}", userId);
                    FarmerProfile newProfile = FarmerProfile.builder()
                            .userId(userId)
                            .status(ProfileStatus.PENDING)
                            .build();
                    return farmerProfileRepository.save(newProfile);
                });
        return mapToDto(profile);
    }

    /**
     * Get farmer profile by user ID.
     */
    @Transactional(readOnly = true)
    public FarmerProfileDto getProfile(UUID userId) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer profile", "userId", userId));
        return mapToDto(profile);
    }

    /**
     * Update farmer profile.
     */
    @Transactional
    public FarmerProfileDto updateProfile(UUID userId, FarmerProfileRequest request) {
        FarmerProfile profile = farmerProfileRepository.findByUserId(userId)
                .orElseGet(() -> FarmerProfile.builder().userId(userId).status(ProfileStatus.PENDING).build());

        // Check username uniqueness
        if (request.getUsername() != null && !request.getUsername().equals(profile.getUsername())) {
            if (farmerProfileRepository.existsByUsername(request.getUsername())) {
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
        if (request.getFarmName() != null) profile.setFarmName(request.getFarmName());
        if (request.getCropTypes() != null) profile.setCropTypes(request.getCropTypes());
        if (request.getFarmPhoto() != null) profile.setFarmPhoto(request.getFarmPhoto());
        if (request.getFarmBio() != null) profile.setFarmBio(request.getFarmBio());
        if (request.getCertificates() != null) profile.setCertificates(request.getCertificates());

        // If profile was rejected and is now being updated, set back to pending
        if (profile.getStatus() == ProfileStatus.REJECTED) {
            profile.setStatus(ProfileStatus.PENDING);
            profile.setRejectionReason(null);
        }

        FarmerProfile savedProfile = farmerProfileRepository.save(profile);
        log.info("Updated farmer profile for user: {}", userId);
        return mapToDto(savedProfile);
    }

    /**
     * Get all pending farmer profiles.
     */
    @Transactional(readOnly = true)
    public Page<FarmerProfileDto> getPendingProfiles(Pageable pageable) {
        return farmerProfileRepository.findByStatus(ProfileStatus.PENDING, pageable)
                .map(this::mapToDto);
    }

    /**
     * Approve or reject a farmer profile.
     */
    @Transactional
    public FarmerProfileDto approveOrRejectProfile(UUID farmerId, ProfileApprovalRequest request, UUID approverUserId) {
        FarmerProfile profile = farmerProfileRepository.findById(farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer profile", "id", farmerId));

        if (request.isApproved()) {
            profile.setStatus(ProfileStatus.APPROVED);
            profile.setApprovedBy(approverUserId);
            profile.setApprovedAt(LocalDateTime.now());
            profile.setRejectionReason(null);
            log.info("Approved farmer profile: {}", farmerId);
        } else {
            profile.setStatus(ProfileStatus.REJECTED);
            profile.setRejectionReason(request.getRejectionReason());
            profile.setApprovedBy(null);
            profile.setApprovedAt(null);
            log.info("Rejected farmer profile: {} - Reason: {}", farmerId, request.getRejectionReason());
        }

        return mapToDto(farmerProfileRepository.save(profile));
    }

    /**
     * Check if farmer is approved.
     */
    @Transactional(readOnly = true)
    public boolean isApproved(UUID userId) {
        return farmerProfileRepository.findByUserId(userId)
                .map(FarmerProfile::isApproved)
                .orElse(false);
    }

    /**
     * Get count of pending farmer profiles.
     */
    @Transactional(readOnly = true)
    public long getPendingCount() {
        return farmerProfileRepository.countByStatus(ProfileStatus.PENDING);
    }

    /**
     * Get all farmers by status.
     */
    @Transactional(readOnly = true)
    public List<FarmerProfileDto> getByStatus(ProfileStatus status) {
        return farmerProfileRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private FarmerProfileDto mapToDto(FarmerProfile profile) {
        return FarmerProfileDto.builder()
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
                .farmName(profile.getFarmName())
                .cropTypes(profile.getCropTypes())
                .farmPhoto(profile.getFarmPhoto())
                .farmBio(profile.getFarmBio())
                .certificates(profile.getCertificates())
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
