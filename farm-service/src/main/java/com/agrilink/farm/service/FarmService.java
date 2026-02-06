package com.agrilink.farm.service;

import com.agrilink.common.exception.ForbiddenException;
import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.farm.dto.CreateFarmRequest;
import com.agrilink.farm.dto.FarmDto;
import com.agrilink.farm.dto.FarmOnboardingRequest;
import com.agrilink.farm.entity.Farm;
import com.agrilink.farm.repository.FarmRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for farm operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;

    /**
     * Create a new farm.
     */
    @Transactional
    public FarmDto createFarm(UUID farmerId, CreateFarmRequest request) {
        log.info("Creating farm for farmer: {}", farmerId);

        Farm farm = Farm.builder()
                .farmerId(farmerId)
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .totalArea(request.getTotalArea())
                .areaUnit(request.getAreaUnit() != null ? request.getAreaUnit() : "HECTARE")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .cropTypes(request.getCropTypes())
                .farmImageUrl(request.getFarmImageUrl())
                .active(true)
                .build();

        Farm savedFarm = farmRepository.save(farm);
        log.info("Farm created with id: {}", savedFarm.getId());

        return mapToDto(savedFarm);
    }

    /**
     * Create or update farm during profile onboarding.
     * If farmer already has a farm, update it; otherwise create a new one.
     */
    @Transactional
    public FarmDto createOrUpdateFarmOnboarding(UUID farmerId, FarmOnboardingRequest request) {
        log.info("Processing farm onboarding for farmer: {}", farmerId);

        // Check if farmer already has a farm
        Farm farm = farmRepository.findFirstByFarmerIdOrderByCreatedAtAsc(farmerId)
                .orElse(null);

        if (farm != null) {
            // Update existing farm
            log.info("Updating existing farm: {} for farmer: {}", farm.getId(), farmerId);
            farm.setName(request.getFarmName());
            farm.setCropTypes(request.getCropTypes());
            farm.setDescription(request.getDescription());
            farm.setFarmImageUrl(request.getFarmImageUrl());
            
            // Build location from city and state if provided
            String location = buildLocation(request.getLocation(), request.getCity(), request.getState());
            if (location != null) {
                farm.setLocation(location);
            }
        } else {
            // Create new farm
            log.info("Creating new farm for farmer: {}", farmerId);
            String location = buildLocation(request.getLocation(), request.getCity(), request.getState());
            
            farm = Farm.builder()
                    .farmerId(farmerId)
                    .name(request.getFarmName())
                    .cropTypes(request.getCropTypes())
                    .description(request.getDescription())
                    .farmImageUrl(request.getFarmImageUrl())
                    .location(location)
                    .areaUnit("HECTARE")
                    .active(true)
                    .build();
        }

        Farm savedFarm = farmRepository.save(farm);
        log.info("Farm onboarding completed. Farm id: {}", savedFarm.getId());

        return mapToDto(savedFarm);
    }

    /**
     * Build location string from components.
     */
    private String buildLocation(String location, String city, String state) {
        if (location != null && !location.isBlank()) {
            return location;
        }
        
        StringBuilder sb = new StringBuilder();
        if (city != null && !city.isBlank()) {
            sb.append(city);
        }
        if (state != null && !state.isBlank()) {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(state);
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    /**
     * Get all farms for a farmer.
     */
    @Transactional(readOnly = true)
    public List<FarmDto> getFarmsByFarmer(UUID farmerId) {
        log.info("Getting farms for farmer: {}", farmerId);
        return farmRepository.findByFarmerIdAndActiveTrue(farmerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get farms with pagination.
     */
    @Transactional(readOnly = true)
    public Page<FarmDto> getFarmsByFarmer(UUID farmerId, Pageable pageable) {
        return farmRepository.findByFarmerIdAndActiveTrue(farmerId, pageable)
                .map(this::mapToDto);
    }

    /**
     * Get farm by ID.
     */
    @Transactional(readOnly = true)
    public FarmDto getFarm(UUID farmId, UUID farmerId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        if (!farm.getFarmerId().equals(farmerId)) {
            throw new ForbiddenException("You don't have access to this farm");
        }

        return mapToDto(farm);
    }

    /**
     * Update farm.
     */
    @Transactional
    public FarmDto updateFarm(UUID farmId, UUID farmerId, CreateFarmRequest request) {
        log.info("Updating farm: {}", farmId);

        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        if (request.getName() != null) farm.setName(request.getName());
        if (request.getDescription() != null) farm.setDescription(request.getDescription());
        if (request.getLocation() != null) farm.setLocation(request.getLocation());
        if (request.getTotalArea() != null) farm.setTotalArea(request.getTotalArea());
        if (request.getAreaUnit() != null) farm.setAreaUnit(request.getAreaUnit());
        if (request.getLatitude() != null) farm.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) farm.setLongitude(request.getLongitude());
        if (request.getCropTypes() != null) farm.setCropTypes(request.getCropTypes());
        if (request.getFarmImageUrl() != null) farm.setFarmImageUrl(request.getFarmImageUrl());

        Farm updatedFarm = farmRepository.save(farm);
        return mapToDto(updatedFarm);
    }

    /**
     * Delete (soft) farm.
     */
    @Transactional
    public void deleteFarm(UUID farmId, UUID farmerId) {
        log.info("Deleting farm: {}", farmId);

        Farm farm = farmRepository.findByIdAndFarmerId(farmId, farmerId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        farm.setActive(false);
        farmRepository.save(farm);
    }

    private FarmDto mapToDto(Farm farm) {
        // Avoid lazy loading fields collection - use 0 as default
        // If field count is needed, use a separate repository query
        int fieldCount = 0;
        try {
            if (farm.getFields() != null) {
                fieldCount = farm.getFields().size();
            }
        } catch (Exception e) {
            log.debug("Could not load fields for farm {}: {}", farm.getId(), e.getMessage());
        }
        
        return FarmDto.builder()
                .id(farm.getId())
                .farmerId(farm.getFarmerId())
                .name(farm.getName())
                .description(farm.getDescription())
                .location(farm.getLocation())
                .totalArea(farm.getTotalArea())
                .areaUnit(farm.getAreaUnit())
                .latitude(farm.getLatitude())
                .longitude(farm.getLongitude())
                .cropTypes(farm.getCropTypes())
                .farmImageUrl(farm.getFarmImageUrl())
                .active(farm.isActive())
                .fieldCount(fieldCount)
                .createdAt(farm.getCreatedAt())
                .updatedAt(farm.getUpdatedAt())
                .build();
    }
}
