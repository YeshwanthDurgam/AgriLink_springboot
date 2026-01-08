package com.agrilink.farm.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for dashboard summary across all farms.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    
    // Farm overview
    private int totalFarms;
    private int totalFields;
    private BigDecimal totalAreaManaged;
    private String areaUnit;
    
    // Crop statistics
    private int activeCrops;
    private int plannedCrops;
    private int harvestedCrops;
    private List<TopCrop> topCrops;
    
    // Upcoming activities
    private List<UpcomingActivity> upcomingActivities;
    
    // Recent harvests
    private List<RecentHarvest> recentHarvests;
    
    // Performance metrics
    private BigDecimal averageYieldEfficiency;
    private BigDecimal totalYieldThisYear;
    private String yieldUnit;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCrop {
        private String cropName;
        private int count;
        private BigDecimal totalArea;
        private BigDecimal totalYield;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingActivity {
        private UUID farmId;
        private String farmName;
        private UUID fieldId;
        private String fieldName;
        private String cropName;
        private String activityType; // PLANTING, HARVESTING
        private String scheduledDate;
        private int daysUntil;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentHarvest {
        private UUID farmId;
        private String farmName;
        private String cropName;
        private BigDecimal yield;
        private String yieldUnit;
        private String harvestDate;
    }
}
