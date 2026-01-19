package com.agrilink.iot.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.iot.dto.AlertDto;
import com.agrilink.iot.service.AlertService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for alert operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    /**
     * Get my alerts.
     * GET /api/v1/alerts
     */
    @GetMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PagedResponse<AlertDto>>> getMyAlerts(
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AlertDto> alerts = alertService.getAlertsByFarmer(farmerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(alerts)));
    }

    /**
     * Get unacknowledged alerts.
     * GET /api/v1/alerts/unacknowledged
     */
    @GetMapping("/unacknowledged")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getUnacknowledgedAlerts(
            HttpServletRequest request,
            Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        List<AlertDto> alerts = alertService.getUnacknowledgedAlerts(farmerId);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    /**
     * Get unacknowledged alert count.
     * GET /api/v1/alerts/count
     */
    @GetMapping("/count")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<Long>> getAlertCount(
            HttpServletRequest request,
            Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        long count = alertService.getUnacknowledgedAlertCount(farmerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Get alerts by device.
     * GET /api/v1/alerts/device/{deviceId}
     */
    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PagedResponse<AlertDto>>> getAlertsByDevice(
            @PathVariable UUID deviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AlertDto> alerts = alertService.getAlertsByDevice(deviceId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(alerts)));
    }

    /**
     * Acknowledge alert.
     * POST /api/v1/alerts/{alertId}/acknowledge
     */
    @PostMapping("/{alertId}/acknowledge")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<AlertDto>> acknowledgeAlert(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID alertId) {
        UUID userId = getUserIdFromRequest(request, authentication);
        AlertDto alert = alertService.acknowledgeAlert(alertId, userId);
        return ResponseEntity.ok(ApiResponse.success("Alert acknowledged", alert));
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
