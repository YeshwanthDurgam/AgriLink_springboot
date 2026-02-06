package com.agrilink.marketplace.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.marketplace.dto.DemandForecastDto;
import com.agrilink.marketplace.service.DemandForecastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for demand forecasting and market analytics.
 * Provides insights for farmers to make informed planting and selling decisions.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class DemandForecastController {

    private final DemandForecastService demandForecastService;

    /**
     * Get demand forecast for a specific crop and location.
     * GET /api/v1/analytics/demand
     * 
     * @param cropType The type of crop (e.g., RICE, WHEAT, TOMATO)
     * @param district The district name (optional)
     * @param state The state name (e.g., MAHARASHTRA, PUNJAB)
     * @return Demand forecast with price range and market insights
     */
    @GetMapping("/demand")
    public ResponseEntity<ApiResponse<DemandForecastDto>> getDemandForecast(
            @RequestParam(required = true) String cropType,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String state) {
        
        log.info("Demand forecast request - Crop: {}, District: {}, State: {}", cropType, district, state);
        
        DemandForecastDto forecast = demandForecastService.getDemandForecast(cropType, district, state);
        
        return ResponseEntity.ok(ApiResponse.success("Demand forecast retrieved successfully", forecast));
    }

    /**
     * Get list of supported crops for demand forecasting.
     * GET /api/v1/analytics/demand/crops
     */
    @GetMapping("/demand/crops")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedCrops() {
        List<String> crops = demandForecastService.getSupportedCrops();
        return ResponseEntity.ok(ApiResponse.success("Supported crops retrieved", crops));
    }

    /**
     * Get list of supported states for demand forecasting.
     * GET /api/v1/analytics/demand/states
     */
    @GetMapping("/demand/states")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedStates() {
        List<String> states = demandForecastService.getSupportedStates();
        return ResponseEntity.ok(ApiResponse.success("Supported states retrieved", states));
    }

    /**
     * Get demand forecast metadata (supported crops and states).
     * GET /api/v1/analytics/demand/metadata
     */
    @GetMapping("/demand/metadata")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDemandMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("crops", demandForecastService.getSupportedCrops());
        metadata.put("states", demandForecastService.getSupportedStates());
        metadata.put("demandLevels", List.of("HIGH", "MEDIUM", "LOW"));
        metadata.put("trendDirections", List.of("UP", "DOWN", "STABLE"));
        
        return ResponseEntity.ok(ApiResponse.success("Metadata retrieved", metadata));
    }
}
