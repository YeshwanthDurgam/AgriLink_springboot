package com.agrilink.farm.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.farm.dto.HarvestGuidanceDto;
import com.agrilink.farm.service.HarvestGuidanceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for harvest guidance and crop planning.
 * Provides weather-integrated recommendations for farmers.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class HarvestGuidanceController {

    private final HarvestGuidanceService harvestGuidanceService;

    /**
     * Get harvest guidance for a specific crop and location.
     * GET /api/v1/farms/harvest-guidance
     *
     * @param cropName The name of the crop
     * @param location The location (optional, can use farm location)
     * @param farmId The farm ID (optional, for weather data)
     * @return Harvest guidance with weather, tools, fertilizers, and irrigation info
     */
    @GetMapping("/harvest-guidance")
    public ResponseEntity<ApiResponse<HarvestGuidanceDto>> getHarvestGuidance(
            @RequestParam String cropName,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) UUID farmId,
            HttpServletRequest request,
            Authentication authentication) {
        
        log.info("Harvest guidance request - Crop: {}, Location: {}, FarmId: {}", cropName, location, farmId);
        
        // Use location from profile if not provided
        String effectiveLocation = location;
        if (!StringUtils.hasText(effectiveLocation)) {
            effectiveLocation = "India"; // Default location
        }
        
        HarvestGuidanceDto guidance = harvestGuidanceService.getHarvestGuidance(cropName, effectiveLocation, farmId);
        
        return ResponseEntity.ok(ApiResponse.success("Harvest guidance retrieved successfully", guidance));
    }

    /**
     * Get list of supported crops for harvest guidance.
     * GET /api/v1/farms/harvest-guidance/crops
     */
    @GetMapping("/harvest-guidance/crops")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedCrops() {
        List<String> crops = harvestGuidanceService.getSupportedCrops();
        return ResponseEntity.ok(ApiResponse.success("Supported crops retrieved", crops));
    }
}
