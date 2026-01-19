package com.agrilink.order.controller;

import com.agrilink.order.service.SalesExportService;
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
 * REST Controller for sales export operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class SalesExportController {

    private final SalesExportService salesExportService;

    /**
     * Export orders data as CSV.
     * GET /api/v1/export/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<byte[]> exportOrders(HttpServletRequest request, Authentication authentication) {
        UUID sellerId = getUserIdFromRequest(request, authentication);
        byte[] data = salesExportService.exportOrdersAsCsv(sellerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    /**
     * Export order items as CSV.
     * GET /api/v1/export/order-items
     */
    @GetMapping("/order-items")
    public ResponseEntity<byte[]> exportOrderItems(HttpServletRequest request, Authentication authentication) {
        UUID sellerId = getUserIdFromRequest(request, authentication);
        byte[] data = salesExportService.exportOrderItemsAsCsv(sellerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=order_items_" + getDateSuffix() + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    /**
     * Export sales analytics as CSV.
     * GET /api/v1/export/sales-analytics
     */
    @GetMapping("/sales-analytics")
    public ResponseEntity<byte[]> exportSalesAnalytics(HttpServletRequest request, Authentication authentication) {
        UUID sellerId = getUserIdFromRequest(request, authentication);
        byte[] data = salesExportService.exportSalesAnalyticsAsCsv(sellerId);
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales_analytics_" + getDateSuffix() + ".csv")
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
