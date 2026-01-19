package com.agrilink.farm.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.farm.dto.CreateFarmRequest;
import com.agrilink.farm.dto.FarmDto;
import com.agrilink.farm.service.FarmService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for farm operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    /**
     * Create a new farm.
     * POST /api/v1/farms
     */
    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<FarmDto>> createFarm(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody CreateFarmRequest createRequest) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        FarmDto farm = farmService.createFarm(farmerId, createRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Farm created successfully", farm));
    }

    /**
     * Get all farms for current user.
     * GET /api/v1/farms
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FarmDto>>> getFarms(
            HttpServletRequest request,
            Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        List<FarmDto> farms = farmService.getFarmsByFarmer(farmerId);
        return ResponseEntity.ok(ApiResponse.success(farms));
    }

    /**
     * Get farm by ID.
     * GET /api/v1/farms/{farmId}
     */
    @GetMapping("/{farmId}")
    public ResponseEntity<ApiResponse<FarmDto>> getFarm(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmId) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        FarmDto farm = farmService.getFarm(farmId, farmerId);
        return ResponseEntity.ok(ApiResponse.success(farm));
    }

    /**
     * Update farm.
     * PUT /api/v1/farms/{farmId}
     */
    @PutMapping("/{farmId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<FarmDto>> updateFarm(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmId,
            @Valid @RequestBody CreateFarmRequest createRequest) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        FarmDto farm = farmService.updateFarm(farmId, farmerId, createRequest);
        return ResponseEntity.ok(ApiResponse.success("Farm updated successfully", farm));
    }

    /**
     * Delete farm.
     * DELETE /api/v1/farms/{farmId}
     */
    @DeleteMapping("/{farmId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<Void>> deleteFarm(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmId) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        farmService.deleteFarm(farmId, farmerId);
        return ResponseEntity.ok(ApiResponse.success("Farm deleted successfully"));
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
