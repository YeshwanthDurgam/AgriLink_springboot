package com.agrilink.farm.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for farm analytics data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmAnalyticsDto {
    
    private UUID farmId;
    private String farmName;
    
    // Overview metrics
    private BigDecimal totalArea;
    private String areaUnit;
    private int totalFields;
    private int activeCropPlans;
    private int completedHarvests;
    
    // Crop distribution
    private List<CropDistribution> cropDistribution;
    
    // Yield statistics
    private List<YieldStat> yieldStats;
    
    // Monthly activity
    private List<MonthlyActivity> monthlyActivities;
    
    // Field utilization
    private BigDecimal fieldUtilizationPercent;
    private List<FieldSummary> fieldSummaries;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CropDistribution {
        private String cropName;
        private BigDecimal area;
        private int count;
        private double percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldStat {
        private String cropName;
        private BigDecimal expectedYield;
        private BigDecimal actualYield;
        private String yieldUnit;
        private double yieldEfficiency; // actual/expected * 100
        private int harvestCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyActivity {
        private String month;
        private int plantings;
        private int harvests;
        private BigDecimal totalYield;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldSummary {
        private UUID fieldId;
        private String fieldName;
        private BigDecimal area;
        private String currentCrop;
        private String status;
        private String soilType;
        private String irrigationType;
    }
}
