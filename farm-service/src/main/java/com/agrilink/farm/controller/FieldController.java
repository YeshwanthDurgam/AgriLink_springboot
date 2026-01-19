package com.agrilink.farm.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.farm.dto.CreateFieldRequest;
import com.agrilink.farm.dto.FieldDto;
import com.agrilink.farm.service.FieldService;
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
 * REST Controller for field operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/farms/{farmId}/fields")
@RequiredArgsConstructor
public class FieldController {

    private final FieldService fieldService;

    /**
     * Create a new field.
     * POST /api/v1/farms/{farmId}/fields
     */
    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<FieldDto>> createField(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID farmId,
            @Valid @RequestBody CreateFieldRequest createRequest) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        FieldDto field = fieldService.createField(farmId, farmerId, createRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Field created successfully", field));
    }

    /**
     * Get all fields for a farm.
     * GET /api/v1/farms/{farmId}/fields
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FieldDto>>> getFields(@PathVariable UUID farmId) {
        List<FieldDto> fields = fieldService.getFieldsByFarm(farmId);
        return ResponseEntity.ok(ApiResponse.success(fields));
    }

    /**
     * Get field by ID.
     * GET /api/v1/farms/{farmId}/fields/{fieldId}
     */
    @GetMapping("/{fieldId}")
    public ResponseEntity<ApiResponse<FieldDto>> getField(
            @PathVariable UUID farmId,
            @PathVariable UUID fieldId) {
        FieldDto field = fieldService.getField(fieldId);
        return ResponseEntity.ok(ApiResponse.success(field));
    }

    /**
     * Update field.
     * PUT /api/v1/farms/{farmId}/fields/{fieldId}
     */
    @PutMapping("/{fieldId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<FieldDto>> updateField(
            @PathVariable UUID farmId,
            @PathVariable UUID fieldId,
            @Valid @RequestBody CreateFieldRequest createRequest) {
        FieldDto field = fieldService.updateField(fieldId, createRequest);
        return ResponseEntity.ok(ApiResponse.success("Field updated successfully", field));
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Delete field.
     * DELETE /api/v1/farms/{farmId}/fields/{fieldId}
     */
    @DeleteMapping("/{fieldId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<ApiResponse<Void>> deleteField(
            @PathVariable UUID farmId,
            @PathVariable UUID fieldId) {
        fieldService.deleteField(fieldId);
        return ResponseEntity.ok(ApiResponse.success("Field deleted successfully"));
    }
}
