package com.agrilink.user.repository;

import com.agrilink.user.entity.ManagerProfile;
import com.agrilink.user.entity.ProfileStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for manager profile operations.
 */
@Repository
public interface ManagerProfileRepository extends JpaRepository<ManagerProfile, UUID> {
    
    Optional<ManagerProfile> findByUserId(UUID userId);
    
    Optional<ManagerProfile> findByUsername(String username);
    
    boolean existsByUserId(UUID userId);
    
    boolean existsByUsername(String username);
    
    List<ManagerProfile> findByStatus(ProfileStatus status);
    
    Page<ManagerProfile> findByStatus(ProfileStatus status, Pageable pageable);
    
    long countByStatus(ProfileStatus status);
}
