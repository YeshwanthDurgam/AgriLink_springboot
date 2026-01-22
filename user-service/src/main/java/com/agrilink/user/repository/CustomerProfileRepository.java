package com.agrilink.user.repository;

import com.agrilink.user.entity.CustomerProfile;
import com.agrilink.user.entity.ProfileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for customer profile operations.
 */
@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, UUID> {
    
    Optional<CustomerProfile> findByUserId(UUID userId);
    
    Optional<CustomerProfile> findByUsername(String username);
    
    boolean existsByUserId(UUID userId);
    
    boolean existsByUsername(String username);
    
    List<CustomerProfile> findByStatus(ProfileStatus status);
    
    long countByStatus(ProfileStatus status);
}
