package com.agrilink.iot.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.iot.dto.DeviceDto;
import com.agrilink.iot.dto.RegisterDeviceRequest;
import com.agrilink.iot.entity.Device;
import com.agrilink.iot.service.DeviceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for device operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * Register a new device.
     * POST /api/v1/devices
     */
    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<DeviceDto>> registerDevice(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody RegisterDeviceRequest registerRequest) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        DeviceDto device = deviceService.registerDevice(farmerId, registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Device registered successfully", device));
    }

    /**
     * Get my devices.
     * GET /api/v1/devices
     */
    @GetMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<List<DeviceDto>>> getMyDevices(
            HttpServletRequest request,
            Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        List<DeviceDto> devices = deviceService.getDevicesByFarmer(farmerId);
        return ResponseEntity.ok(ApiResponse.success(devices));
    }

    /**
     * Get my devices with pagination.
     * GET /api/v1/devices/paged
     */
    @GetMapping("/paged")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<PagedResponse<DeviceDto>>> getMyDevicesPaged(
            HttpServletRequest request,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<DeviceDto> devices = deviceService.getDevicesByFarmer(farmerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(devices)));
    }

    /**
     * Get device by ID.
     * GET /api/v1/devices/{deviceId}
     */
    @GetMapping("/{deviceId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<DeviceDto>> getDevice(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID deviceId) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        DeviceDto device = deviceService.getDevice(deviceId, farmerId);
        return ResponseEntity.ok(ApiResponse.success(device));
    }

    /**
     * Update device status.
     * PATCH /api/v1/devices/{deviceId}/status
     */
    @PatchMapping("/{deviceId}/status")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<DeviceDto>> updateDeviceStatus(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID deviceId,
            @RequestParam Device.DeviceStatus status) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        DeviceDto device = deviceService.updateDeviceStatus(deviceId, farmerId, status);
        return ResponseEntity.ok(ApiResponse.success("Device status updated", device));
    }

    /**
     * Delete device.
     * DELETE /api/v1/devices/{deviceId}
     */
    @DeleteMapping("/{deviceId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID deviceId) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        deviceService.deleteDevice(deviceId, farmerId);
        return ResponseEntity.ok(ApiResponse.success("Device decommissioned"));
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
