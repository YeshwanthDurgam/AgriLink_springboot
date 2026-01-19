package com.agrilink.farm.controller;

import com.agrilink.farm.service.ExportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * REST Controller for export operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * Export farms data as CSV.
     * GET /api/v1/export/farms
     */
    @GetMapping("/farms")
    public ResponseEntity<byte[]> exportFarms(HttpServletRequest request, Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        byte[] data = exportService.exportFarmsAsCsv(farmerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=farms_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    /**
     * Export fields data as CSV.
     * GET /api/v1/export/fields
     */
    @GetMapping("/fields")
    public ResponseEntity<byte[]> exportFields(HttpServletRequest request, Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        byte[] data = exportService.exportFieldsAsCsv(farmerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fields_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    /**
     * Export crop plans as CSV.
     * GET /api/v1/export/crops
     */
    @GetMapping("/crops")
    public ResponseEntity<byte[]> exportCropPlans(HttpServletRequest request, Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        byte[] data = exportService.exportCropPlansAsCsv(farmerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crop_plans_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    /**
     * Export analytics summary as CSV.
     * GET /api/v1/export/analytics
     */
    @GetMapping("/analytics")
    public ResponseEntity<byte[]> exportAnalytics(HttpServletRequest request, Authentication authentication) {
        UUID farmerId = getUserIdFromRequest(request, authentication);
        byte[] data = exportService.exportAnalyticsSummaryAsCsv(farmerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=analytics_report_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    private String getDateSuffix() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private UUID getUserIdFromRequest(HttpServletRequest request, Authentication authentication) {
        String userIdStr = (String) request.getAttribute("userId");
        if (StringUtils.hasText(userIdStr)) {
            return UUID.fromString(userIdStr);
        }
        return UUID.nameUUIDFromBytes(authentication.getName().getBytes());
    }
}
