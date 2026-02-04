package com.agrilink.user.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.user.dto.CustomerProfileDto;
import com.agrilink.user.dto.CustomerProfileRequest;
import com.agrilink.user.entity.CustomerProfile;
import com.agrilink.user.entity.ProfileStatus;
import com.agrilink.user.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for customer profile operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerProfileService {

    private final CustomerProfileRepository customerProfileRepository;

    /**
     * Get or create customer profile for a user.
     */
    @Transactional
    public CustomerProfileDto getOrCreateProfile(UUID userId) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.info("Creating new customer profile for user: {}", userId);
                    CustomerProfile newProfile = CustomerProfile.builder()
                            .userId(userId)
                            .status(ProfileStatus.APPROVED) // Customers are auto-approved
                            .build();
                    return customerProfileRepository.save(newProfile);
                });
        return mapToDto(profile);
    }

    /**
     * Get customer profile by user ID.
     */
    @Transactional(readOnly = true)
    public CustomerProfileDto getProfile(UUID userId) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile", "userId", userId));
        return mapToDto(profile);
    }

    /**
     * Update customer profile.
     */
    @Transactional
    public CustomerProfileDto updateProfile(UUID userId, CustomerProfileRequest request) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userId)
                .orElseGet(() -> CustomerProfile.builder().userId(userId).status(ProfileStatus.APPROVED).build());

        // Check username uniqueness
        if (request.getUsername() != null && !request.getUsername().equals(profile.getUsername())) {
            if (customerProfileRepository.existsByUsername(request.getUsername())) {
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
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getPincode() != null) profile.setPincode(request.getPincode());

        CustomerProfile savedProfile = customerProfileRepository.save(profile);
        log.info("Updated customer profile for user: {}", userId);
        return mapToDto(savedProfile);
    }

    private CustomerProfileDto mapToDto(CustomerProfile profile) {
        return CustomerProfileDto.builder()
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
                .address(profile.getAddress())
                .pincode(profile.getPincode())
                .status(profile.getStatus())
                .profileComplete(profile.isProfileComplete())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
