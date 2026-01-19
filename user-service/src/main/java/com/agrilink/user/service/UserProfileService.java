package com.agrilink.user.service;

import com.agrilink.user.dto.PublicProfileDto;
import com.agrilink.user.dto.UpdateProfileRequest;
import com.agrilink.user.dto.UserProfileDto;
import com.agrilink.user.entity.UserProfile;
import com.agrilink.user.repository.UserProfileRepository;
import com.agrilink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for user profile operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    /**
     * Get user profile by user ID, creating if not exists.
     */
    @Transactional
    public UserProfileDto getOrCreateProfile(UUID userId) {
        log.info("Getting or creating profile for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile newProfile = UserProfile.builder()
                            .userId(userId)
                            .build();
                    return userProfileRepository.save(newProfile);
                });

        return mapToDto(profile);
    }

    /**
     * Get user profile by user ID.
     */
    @Transactional(readOnly = true)
    public UserProfileDto getProfile(UUID userId) {
        log.info("Getting profile for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", "userId", userId));

        return mapToDto(profile);
    }

    /**
     * Update user profile.
     */
    @Transactional
    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder().userId(userId).build());

        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName());
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            profile.setCity(request.getCity());
        }
        if (request.getState() != null) {
            profile.setState(request.getState());
        }
        if (request.getCountry() != null) {
            profile.setCountry(request.getCountry());
        }
        if (request.getPostalCode() != null) {
            profile.setPostalCode(request.getPostalCode());
        }
        if (request.getProfilePictureUrl() != null) {
            profile.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        log.info("Profile updated for user: {}", userId);

        return mapToDto(savedProfile);
    }

    private UserProfileDto mapToDto(UserProfile profile) {
        return UserProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .fullName(profile.getFullName())
                .dateOfBirth(profile.getDateOfBirth())
                .address(profile.getAddress())
                .city(profile.getCity())
                .state(profile.getState())
                .country(profile.getCountry())
                .postalCode(profile.getPostalCode())
                .profilePictureUrl(profile.getProfilePictureUrl())
                .bio(profile.getBio())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    /**
     * Get public profile information (limited data for public viewing).
     */
    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(UUID userId) {
        log.info("Getting public profile for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(null);
        
        if (profile == null) {
            // Return a default profile for unknown users
            return PublicProfileDto.builder()
                    .userId(userId)
                    .firstName("Farmer")
                    .lastName("")
                    .fullName("Farmer")
                    .city("")
                    .state("")
                    .profilePictureUrl("https://randomuser.me/api/portraits/men/32.jpg")
                    .build();
        }

        return mapToPublicDto(profile);
    }

    /**
     * Get public profiles for multiple users.
     */
    @Transactional(readOnly = true)
    public List<PublicProfileDto> getPublicProfiles(List<UUID> userIds) {
        log.info("Getting public profiles for {} users", userIds.size());
        
        List<UserProfile> profiles = userProfileRepository.findByUserIdIn(userIds);
        
        return userIds.stream()
                .map(userId -> profiles.stream()
                        .filter(p -> p.getUserId().equals(userId))
                        .findFirst()
                        .map(this::mapToPublicDto)
                        .orElse(PublicProfileDto.builder()
                                .userId(userId)
                                .firstName("Farmer")
                                .lastName("")
                                .fullName("Farmer")
                                .profilePictureUrl("https://randomuser.me/api/portraits/men/32.jpg")
                                .build()))
                .collect(Collectors.toList());
    }

    private PublicProfileDto mapToPublicDto(UserProfile profile) {
        String fullName = "";
        if (profile.getFirstName() != null) {
            fullName = profile.getFirstName();
            if (profile.getLastName() != null) {
                fullName += " " + profile.getLastName();
            }
        }
        
        return PublicProfileDto.builder()
                .userId(profile.getUserId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .fullName(fullName.trim().isEmpty() ? "Farmer" : fullName.trim())
                .city(profile.getCity())
                .state(profile.getState())
                .profilePictureUrl(profile.getProfilePictureUrl() != null 
                        ? profile.getProfilePictureUrl() 
                        : "https://randomuser.me/api/portraits/men/32.jpg")
                .build();
    }
}
