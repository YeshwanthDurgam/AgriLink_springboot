package com.agrilink.iot.controller;

import com.agrilink.iot.dto.SensorAnalyticsDto;
import com.agrilink.iot.service.SensorAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
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
    public ResponseEntity<Map<String, Object>> getSensorAnalytics(
            HttpServletRequest request,
            Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        log.info("Getting sensor analytics for farmer: {}", farmerId);
        
        SensorAnalyticsDto analytics = sensorAnalyticsService.getSensorAnalytics(farmerId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);
        
        return ResponseEntity.ok(response);
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
