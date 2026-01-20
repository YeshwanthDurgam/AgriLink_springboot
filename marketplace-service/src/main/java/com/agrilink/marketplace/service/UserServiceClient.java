package com.agrilink.marketplace.service;

import com.agrilink.marketplace.dto.UserPublicProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;

/**
 * Client service to fetch user information from user-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private final WebClient userServiceWebClient;

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    /**
     * Get public profile for a user.
     */
    public UserPublicProfileDto getPublicProfile(UUID userId) {
        try {
            Map<String, Object> response = userServiceWebClient
                    .get()
                    .uri("/api/v1/users/public/{userId}", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                return mapToDto(data);
            }
        } catch (Exception e) {
            log.warn("Failed to fetch public profile for user {}: {}", userId, e.getMessage());
        }
        
        // Return default profile on failure
        return UserPublicProfileDto.builder()
                .userId(userId)
                .firstName("Farmer")
                .lastName("")
                .fullName("Farmer")
                .profilePictureUrl("https://randomuser.me/api/portraits/men/32.jpg")
                .build();
    }

    /**
     * Get public profiles for multiple users.
     */
    public List<UserPublicProfileDto> getPublicProfiles(List<UUID> userIds) {
        try {
            Map<String, Object> response = userServiceWebClient
                    .post()
                    .uri("/api/v1/users/public/batch")
                    .bodyValue(userIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.get("data") != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> dataList = (List<Map<String, Object>>) response.get("data");
                List<UserPublicProfileDto> profiles = new ArrayList<>();
                for (Map<String, Object> data : dataList) {
                    profiles.add(mapToDto(data));
                }
                return profiles;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch public profiles: {}", e.getMessage());
        }
        
        // Return default profiles on failure
        return userIds.stream()
                .map(userId -> UserPublicProfileDto.builder()
                        .userId(userId)
                        .firstName("Farmer")
                        .lastName("")
                        .fullName("Farmer")
                        .profilePictureUrl("https://randomuser.me/api/portraits/men/32.jpg")
                        .build())
                .toList();
    }

    private UserPublicProfileDto mapToDto(Map<String, Object> data) {
        return UserPublicProfileDto.builder()
                .userId(data.get("userId") != null ? UUID.fromString(data.get("userId").toString()) : null)
                .firstName(data.get("firstName") != null ? data.get("firstName").toString() : null)
                .lastName(data.get("lastName") != null ? data.get("lastName").toString() : null)
                .fullName(data.get("fullName") != null ? data.get("fullName").toString() : "Farmer")
                .city(data.get("city") != null ? data.get("city").toString() : null)
                .state(data.get("state") != null ? data.get("state").toString() : null)
                .profilePictureUrl(data.get("profilePictureUrl") != null 
                        ? data.get("profilePictureUrl").toString() 
                        : "https://randomuser.me/api/portraits/men/32.jpg")
                .build();
    }

    /**
     * Get follower count for a farmer from user-service.
     */
    public Long getFollowerCount(UUID farmerId) {
        try {
            Map<String, Object> response = userServiceWebClient
                    .get()
                    .uri("/api/v1/farmers/{farmerId}/followers/count", farmerId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .timeout(TIMEOUT)
                    .block();

            if (response != null && response.get("data") != null) {
                Object data = response.get("data");
                if (data instanceof Number) {
                    return ((Number) data).longValue();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch follower count for farmer {}: {}", farmerId, e.getMessage());
        }
        return 0L;
    }

    /**
     * Get follower counts for multiple farmers (batch).
     */
    public Map<UUID, Long> getFollowerCounts(List<UUID> farmerIds) {
        Map<UUID, Long> counts = new HashMap<>();
        for (UUID farmerId : farmerIds) {
            counts.put(farmerId, getFollowerCount(farmerId));
        }
        return counts;
    }
}
