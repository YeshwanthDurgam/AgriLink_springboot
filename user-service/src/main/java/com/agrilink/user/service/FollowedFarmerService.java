package com.agrilink.user.service;

import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.user.dto.FollowedFarmerDto;
import com.agrilink.user.entity.FollowedFarmer;
import com.agrilink.user.repository.FollowedFarmerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing followed farmers functionality.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FollowedFarmerService {

    private final FollowedFarmerRepository followedFarmerRepository;

    /**
     * Follow a farmer.
     * @param userId The user who wants to follow
     * @param farmerId The farmer to follow
     * @return FollowedFarmerDto
     */
    @Transactional
    public FollowedFarmerDto followFarmer(UUID userId, UUID farmerId) {
        log.info("User {} following farmer {}", userId, farmerId);

        // Cannot follow yourself
        if (userId.equals(farmerId)) {
            throw new BadRequestException("You cannot follow yourself");
        }

        // Check if already following
        if (followedFarmerRepository.existsByUserIdAndFarmerId(userId, farmerId)) {
            throw new BadRequestException("You are already following this farmer");
        }

        FollowedFarmer followedFarmer = FollowedFarmer.builder()
                .userId(userId)
                .farmerId(farmerId)
                .build();

        followedFarmer = followedFarmerRepository.save(followedFarmer);
        log.info("User {} successfully followed farmer {}", userId, farmerId);

        return mapToDto(followedFarmer);
    }

    /**
     * Unfollow a farmer.
     * @param userId The user who wants to unfollow
     * @param farmerId The farmer to unfollow
     */
    @Transactional
    public void unfollowFarmer(UUID userId, UUID farmerId) {
        log.info("User {} unfollowing farmer {}", userId, farmerId);

        FollowedFarmer followedFarmer = followedFarmerRepository.findByUserIdAndFarmerId(userId, farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow relationship not found"));

        followedFarmerRepository.delete(followedFarmer);
        log.info("User {} successfully unfollowed farmer {}", userId, farmerId);
    }

    /**
     * Get all farmers followed by a user.
     * @param userId The user ID
     * @return List of FollowedFarmerDto
     */
    @Transactional(readOnly = true)
    public List<FollowedFarmerDto> getFollowedFarmers(UUID userId) {
        log.info("Getting followed farmers for user {}", userId);
        
        List<FollowedFarmer> followedFarmers = followedFarmerRepository.findByUserId(userId);
        
        return followedFarmers.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get farmer IDs followed by a user.
     * @param userId The user ID
     * @return List of farmer UUIDs
     */
    @Transactional(readOnly = true)
    public List<UUID> getFollowedFarmerIds(UUID userId) {
        log.info("Getting followed farmer IDs for user {}", userId);
        return followedFarmerRepository.findFarmerIdsByUserId(userId);
    }

    /**
     * Check if a user is following a specific farmer.
     * @param userId The user ID
     * @param farmerId The farmer ID
     * @return true if following, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(UUID userId, UUID farmerId) {
        return followedFarmerRepository.existsByUserIdAndFarmerId(userId, farmerId);
    }

    /**
     * Get follower count for a farmer.
     * @param farmerId The farmer ID
     * @return Number of followers
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(UUID farmerId) {
        return followedFarmerRepository.countByFarmerId(farmerId);
    }

    private FollowedFarmerDto mapToDto(FollowedFarmer followedFarmer) {
        return FollowedFarmerDto.builder()
                .id(followedFarmer.getId())
                .userId(followedFarmer.getUserId())
                .farmerId(followedFarmer.getFarmerId())
                .followedAt(followedFarmer.getFollowedAt())
                .build();
    }
}
