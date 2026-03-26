package com.agrilink.order.controller;

import com.agrilink.common.dto.ApiResponse;
import com.agrilink.common.dto.PagedResponse;
import com.agrilink.order.dto.CreateFraudCaseRequest;
import com.agrilink.order.dto.FraudCaseDto;
import com.agrilink.order.service.FraudCaseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for fraud case management.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudCaseService fraudCaseService;

    /**
     * Helper method to get user ID from JWT token.
     */
    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }

    /**
     * Create a new fraud case.
     * POST /api/v1/fraud/cases
     */
    @PostMapping("/cases")
    @PreAuthorize("hasRole('BUYER') or hasRole('SELLER') or hasRole('FARMER')")
    public ResponseEntity<ApiResponse<FraudCaseDto>> createFraudCase(
            HttpServletRequest request,
            Authentication authentication,
            @Valid @RequestBody CreateFraudCaseRequest fraudCaseRequest) {
        UUID reporterId = getUserIdFromRequest(request, authentication);
        log.info("Creating fraud case from user: {}", reporterId);
        
        FraudCaseDto fraudCase = fraudCaseService.createFraudCase(reporterId, fraudCaseRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fraud case created successfully", fraudCase));
    }

    /**
     * Get fraud case by ID.
     * GET /api/v1/fraud/cases/{caseId}
     */
    @GetMapping("/cases/{caseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCaseDto>> getFraudCase(
            @PathVariable UUID caseId) {
        log.info("Fetching fraud case: {}", caseId);
        
        FraudCaseDto fraudCase = fraudCaseService.getFraudCase(caseId);
        return ResponseEntity.ok(ApiResponse.success(fraudCase));
    }

    /**
     * Get all fraud cases with pagination.
     * GET /api/v1/fraud/cases?page=0&size=20
     */
    @GetMapping("/cases")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<FraudCaseDto>>> getAllFraudCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID accusedId) {
        
        log.info("Fetching fraud cases - page: {}, size: {}, status: {}", page, size, status);
        
        Page<FraudCaseDto> fraudCases;
        
        if (StringUtils.hasText(status)) {
            fraudCases = fraudCaseService.getFraudCasesByStatus(status, page, size);
        } else if (StringUtils.hasText(priority)) {
            fraudCases = fraudCaseService.getFraudCasesByPriority(priority, page, size);
        } else if (accusedId != null) {
            fraudCases = fraudCaseService.getFraudCasesByAccused(accusedId, page, size);
        } else {
            fraudCases = fraudCaseService.getAllFraudCases(page, size);
        }

        PagedResponse<FraudCaseDto> response = PagedResponse.<FraudCaseDto>builder()
                .content(fraudCases.getContent())
                .totalPages(fraudCases.getTotalPages())
                .totalElements(fraudCases.getTotalElements())
                    .page(fraudCases.getNumber())
                    .size(fraudCases.getSize())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Fraud cases retrieved successfully", response));
    }

    /**
     * Update fraud case status.
     * PUT /api/v1/fraud/cases/{caseId}/status
     */
    @PutMapping("/cases/{caseId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCaseDto>> updateFraudCaseStatus(
            HttpServletRequest request,
            Authentication authentication,
            @PathVariable UUID caseId,
            @RequestParam String status,
            @RequestParam(required = false) String resolution) {
        
        UUID adminId = getUserIdFromRequest(request, authentication);
        log.info("Admin {} updating fraud case {} status to {}", adminId, caseId, status);
        
        FraudCaseDto fraudCase = fraudCaseService.updateFraudCaseStatus(caseId, status, adminId, resolution);
        return ResponseEntity.ok(ApiResponse.success("Fraud case status updated", fraudCase));
    }

    /**
     * Add investigation notes to fraud case.
     * POST /api/v1/fraud/cases/{caseId}/notes
     */
    @PostMapping("/cases/{caseId}/notes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCaseDto>> addInvestigationNotes(
            @PathVariable UUID caseId,
            @RequestParam String notes) {
        
        log.info("Adding investigation notes to fraud case: {}", caseId);
        
        FraudCaseDto fraudCase = fraudCaseService.addInvestigationNotes(caseId, notes);
        return ResponseEntity.ok(ApiResponse.success("Investigation notes added", fraudCase));
    }

    /**
     * Get fraud statistics.
     * GET /api/v1/fraud/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Object>> getFraudStats() {
        log.info("Fetching fraud statistics");
        
        long openCases = fraudCaseService.getOpenCasesCount();
        
        return ResponseEntity.ok(ApiResponse.success("Fraud statistics", 
                new java.util.HashMap<String, Long>() {{
                    put("openCases", openCases);
                }}));
    }
}
