package com.agrilink.user.repository;

import com.agrilink.user.entity.FollowedFarmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for FollowedFarmer entity operations.
 */
@Repository
public interface FollowedFarmerRepository extends JpaRepository<FollowedFarmer, UUID> {

    /**
     * Find all farmers followed by a specific user.
     */
    List<FollowedFarmer> findByUserId(UUID userId);

    /**
     * Get just the farmer IDs followed by a user.
     */
    @Query("SELECT f.farmerId FROM FollowedFarmer f WHERE f.userId = :userId")
    List<UUID> findFarmerIdsByUserId(@Param("userId") UUID userId);

    /**
     * Check if a user is following a specific farmer.
     */
    boolean existsByUserIdAndFarmerId(UUID userId, UUID farmerId);

    /**
     * Find a specific follow relationship.
     */
    Optional<FollowedFarmer> findByUserIdAndFarmerId(UUID userId, UUID farmerId);

    /**
     * Delete a follow relationship.
     */
    void deleteByUserIdAndFarmerId(UUID userId, UUID farmerId);

    /**
     * Count followers for a specific farmer.
     */
    long countByFarmerId(UUID farmerId);

    /**
     * Get all users following a specific farmer.
     */
    @Query("SELECT f.userId FROM FollowedFarmer f WHERE f.farmerId = :farmerId")
    List<UUID> findUserIdsByFarmerId(@Param("farmerId") UUID farmerId);
}
