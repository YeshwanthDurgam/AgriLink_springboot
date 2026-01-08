package com.agrilink.order.controller;

import com.agrilink.order.dto.SalesAnalyticsDto;
import com.agrilink.order.service.SalesAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for sales analytics.
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Slf4j
public class SalesAnalyticsController {

    private final SalesAnalyticsService salesAnalyticsService;

    /**
     * Get sales analytics for the authenticated seller.
     */
    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesAnalytics(Authentication authentication) {
        UUID sellerId = UUID.nameUUIDFromBytes(authentication.getName().getBytes());
        log.info("Getting sales analytics for seller: {}", sellerId);
        
        SalesAnalyticsDto analytics = salesAnalyticsService.getSalesAnalytics(sellerId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analytics);
        
        return ResponseEntity.ok(response);
    }
}
