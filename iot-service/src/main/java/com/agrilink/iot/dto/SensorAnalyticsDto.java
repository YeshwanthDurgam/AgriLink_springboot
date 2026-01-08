package com.agrilink.iot.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for IoT sensor analytics data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorAnalyticsDto {
    
    private UUID farmId;
    private String farmName;
    
    // Device overview
    private int totalDevices;
    private int onlineDevices;
    private int offlineDevices;
    private int alertingDevices;
    
    // Sensor readings summary
    private List<SensorSummary> sensorSummaries;
    
    // Historical data for charts
    private List<TimeSeriesData> temperatureHistory;
    private List<TimeSeriesData> humidityHistory;
    private List<TimeSeriesData> soilMoistureHistory;
    
    // Current conditions
    private CurrentConditions currentConditions;
    
    // Active alerts
    private List<AlertSummary> activeAlerts;
    private int totalAlertsToday;
    private int totalAlertsThisWeek;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SensorSummary {
        private UUID deviceId;
        private String deviceName;
        private String deviceType;
        private String status;
        private BigDecimal lastReading;
        private String metricType;
        private String unit;
        private String lastUpdated;
        private BigDecimal batteryLevel;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesData {
        private String timestamp;
        private BigDecimal value;
        private String metricType;
        private UUID deviceId;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentConditions {
        private BigDecimal temperature;
        private String temperatureUnit;
        private BigDecimal humidity;
        private BigDecimal soilMoisture;
        private BigDecimal soilPh;
        private BigDecimal lightIntensity;
        private BigDecimal rainfall;
        private BigDecimal windSpeed;
        private String overallStatus; // OPTIMAL, WARNING, CRITICAL
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertSummary {
        private UUID alertId;
        private UUID deviceId;
        private String deviceName;
        private String alertType;
        private String severity;
        private String message;
        private String triggeredAt;
        private boolean acknowledged;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricStats {
        private String metricType;
        private BigDecimal min;
        private BigDecimal max;
        private BigDecimal avg;
        private BigDecimal current;
        private String trend; // UP, DOWN, STABLE
    }
}
