package com.agrilink.iot.controller;

import com.agrilink.iot.dto.SensorAnalyticsDto;
import com.agrilink.iot.service.SensorAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for IoT sensor analytics.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
public class SensorAnalyticsController {

    private final SensorAnalyticsService sensorAnalyticsService;

    /**
     * Get sensor analytics for the authenticated farmer.
     */
    @GetMapping("/sensors")
    public ResponseEntity<Map<String, Object>> getSensorAnalytics(Authentication authentication) {
        UUID farmerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        log.info("Getting sensor analytics for farmer: {}", farmerId);
        
        SensorAnalyticsDto analytics = sensorAnalyticsService.getSensorAnalytics(farmerId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);
        
        return ResponseEntity.ok(response);
    }
}
