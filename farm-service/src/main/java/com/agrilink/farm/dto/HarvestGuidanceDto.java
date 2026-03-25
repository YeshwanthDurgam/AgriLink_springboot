package com.agrilink.farm.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for harvest guidance response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestGuidanceDto {
    
    private String cropName;
    private String location;
    
    // Weather forecast summary
    private WeatherSummary weatherSummary;
    
    // Recommended tools and equipment
    private List<ToolRecommendation> recommendedTools;
    
    // Fertilizer suggestions
    private List<FertilizerSuggestion> fertilizerSuggestions;
    
    // Irrigation guidance
    private IrrigationGuidance irrigationGuidance;
    
    // Harvest readiness
    private HarvestReadiness harvestReadiness;
    
    // General cultivation tips
    private List<String> cultivationTips;
    
    // Flag to indicate if data is simulated
    private boolean isSimulated;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeatherSummary {
        private String condition;
        private BigDecimal temperature;
        private BigDecimal humidity;
        private BigDecimal rainfall;
        private String forecast;
        private String advisoryMessage;
        private List<DayForecast> dailyForecast;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayForecast {
        private String day;
        private String condition;
        private BigDecimal minTemp;
        private BigDecimal maxTemp;
        private BigDecimal rainChance;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolRecommendation {
        private String name;
        private String category;
        private String purpose;
        private String priority; // ESSENTIAL, RECOMMENDED, OPTIONAL
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FertilizerSuggestion {
        private String name;
        private String type; // ORGANIC, CHEMICAL, BIO
        private String dosage;
        private String applicationMethod;
        private String timing;
        private String benefit;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IrrigationGuidance {
        private String method; // DRIP, SPRINKLER, FLOOD, FURROW
        private String frequency;
        private BigDecimal waterRequirement; // liters per acre
        private String bestTime;
        private String currentAdvice;
        private List<String> tips;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HarvestReadiness {
        private int readinessPercentage;
        private String status; // NOT_READY, APPROACHING, READY, OVERDUE
        private String estimatedDays;
        private List<String> readinessIndicators;
        private List<String> harvestingTips;
    }
}
