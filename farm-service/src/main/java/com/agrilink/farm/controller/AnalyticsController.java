package com.agrilink.farm.controller;

import com.agrilink.farm.dto.DashboardSummaryDto;
import com.agrilink.farm.dto.FarmAnalyticsDto;
import com.agrilink.farm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for farm analytics.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get dashboard summary for the authenticated farmer.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(Authentication authentication) {
        UUID farmerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        log.info("Getting dashboard summary for farmer: {}", farmerId);
        
        DashboardSummaryDto summary = analyticsService.getDashboardSummary(farmerId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", summary);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get analytics for a specific farm.
     */
    @GetMapping("/farms/{farmId}")
    public ResponseEntity<Map<String, Object>> getFarmAnalytics(
            @PathVariable UUID farmId,
            Authentication authentication) {
        UUID farmerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        log.info("Getting analytics for farm: {} by farmer: {}", farmId, farmerId);
        
        FarmAnalyticsDto analytics = analyticsService.getFarmAnalytics(farmId, farmerId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);
        
        return ResponseEntity.ok(response);
    }
}
