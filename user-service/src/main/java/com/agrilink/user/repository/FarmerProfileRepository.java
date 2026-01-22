package com.agrilink.user.repository;

import com.agrilink.user.entity.FarmerProfile;
import com.agrilink.user.entity.ProfileStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for farmer profile operations.
 */
@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, UUID> {
    
    Optional<FarmerProfile> findByUserId(UUID userId);
    
    Optional<FarmerProfile> findByUsername(String username);
    
    boolean existsByUserId(UUID userId);
    
    boolean existsByUsername(String username);
    
    List<FarmerProfile> findByStatus(ProfileStatus status);
    
    Page<FarmerProfile> findByStatus(ProfileStatus status, Pageable pageable);
    
    long countByStatus(ProfileStatus status);
}
