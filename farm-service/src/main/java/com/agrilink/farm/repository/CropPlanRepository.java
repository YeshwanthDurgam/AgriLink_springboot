package com.agrilink.farm.repository;

import com.agrilink.farm.entity.CropPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for CropPlan entity operations.
 */
@Repository
public interface CropPlanRepository extends JpaRepository<CropPlan, UUID> {
    
    List<CropPlan> findByFieldId(UUID fieldId);
    
    List<CropPlan> findByStatus(CropPlan.CropStatus status);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId")
    List<CropPlan> findByFarmerId(@Param("farmerId") UUID farmerId);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.id = :farmId")
    List<CropPlan> findByFarmId(@Param("farmId") UUID farmId);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId AND cp.status IN :statuses")
    List<CropPlan> findByFarmerIdAndStatusIn(@Param("farmerId") UUID farmerId, @Param("statuses") List<CropPlan.CropStatus> statuses);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.id = :farmId AND cp.status = :status")
    List<CropPlan> findByFarmIdAndStatus(@Param("farmId") UUID farmId, @Param("status") CropPlan.CropStatus status);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId AND cp.actualHarvestDate BETWEEN :startDate AND :endDate")
    List<CropPlan> findHarvestedByFarmerIdBetweenDates(@Param("farmerId") UUID farmerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId AND cp.plantingDate BETWEEN :startDate AND :endDate")
    List<CropPlan> findPlantedByFarmerIdBetweenDates(@Param("farmerId") UUID farmerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId AND " +
           "((cp.plantingDate BETWEEN :startDate AND :endDate) OR (cp.expectedHarvestDate BETWEEN :startDate AND :endDate))")
    List<CropPlan> findUpcomingActivitiesByFarmerId(@Param("farmerId") UUID farmerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COUNT(cp) FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId AND cp.status = :status")
    long countByFarmerIdAndStatus(@Param("farmerId") UUID farmerId, @Param("status") CropPlan.CropStatus status);
    
    @Query("SELECT COUNT(cp) FROM CropPlan cp WHERE cp.field.farm.id = :farmId AND cp.status = :status")
    long countByFieldFarmIdAndStatus(@Param("farmId") UUID farmId, @Param("status") CropPlan.CropStatus status);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.farm.farmerId = :farmerId")
    List<CropPlan> findByFieldFarmFarmerId(@Param("farmerId") UUID farmerId);
    
    @Query("SELECT cp FROM CropPlan cp WHERE cp.field.id = :fieldId AND cp.status IN ('PLANTED', 'GROWING') ORDER BY cp.plantingDate DESC")
    List<CropPlan> findActiveCropsByFieldId(@Param("fieldId") UUID fieldId);
}
