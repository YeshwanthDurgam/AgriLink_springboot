package com.agrilink.farm.repository;

import com.agrilink.farm.entity.Farm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Farm entity operations.
 */
@Repository
public interface FarmRepository extends JpaRepository<Farm, UUID> {
    
    List<Farm> findByFarmerIdAndActiveTrue(UUID farmerId);
    
    Page<Farm> findByFarmerIdAndActiveTrue(UUID farmerId, Pageable pageable);
    
    Optional<Farm> findByIdAndFarmerId(UUID id, UUID farmerId);
    
    boolean existsByIdAndFarmerId(UUID id, UUID farmerId);
    
    /**
     * Find the first farm for a farmer (for onboarding update-or-create logic)
     */
    Optional<Farm> findFirstByFarmerIdOrderByCreatedAtAsc(UUID farmerId);
    
    /**
     * Check if farmer has any active farms
     */
    boolean existsByFarmerIdAndActiveTrue(UUID farmerId);
}
