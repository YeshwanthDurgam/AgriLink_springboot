package com.agrilink.farm.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.farm.dto.WeatherDto;
import com.agrilink.farm.dto.WeatherDto.FarmingRecommendation;
import com.agrilink.farm.service.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for weather data.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * Get weather for a specific farm.
     * GET /api/v1/weather/farm/{farmId}
     */
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<ApiResponse<WeatherDto>> getWeatherForFarm(@PathVariable UUID farmId) {
        log.info("Getting weather for farm: {}", farmId);
        WeatherDto weather = weatherService.getWeatherForFarm(farmId);
        return ResponseEntity.ok(ApiResponse.success(weather));
    }

    /**
     * Get weather for coordinates.
     * GET /api/v1/weather/location
     */
    @GetMapping("/location")
    public ResponseEntity<ApiResponse<WeatherDto>> getWeatherForLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        log.info("Getting weather for location: {}, {}", latitude, longitude);
        WeatherDto weather = weatherService.getWeatherForLocation(latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success(weather));
    }

    /**
     * Get farming recommendations based on weather.
     * GET /api/v1/weather/farm/{farmId}/recommendations
     */
    @GetMapping("/farm/{farmId}/recommendations")
    public ResponseEntity<ApiResponse<List<FarmingRecommendation>>> getFarmingRecommendations(
            @PathVariable UUID farmId) {
        log.info("Getting farming recommendations for farm: {}", farmId);
        List<FarmingRecommendation> recommendations = weatherService.getFarmingRecommendations(farmId);
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }
}
