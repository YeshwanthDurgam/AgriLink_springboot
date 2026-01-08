package com.agrilink.farm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for weather data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherDto {
    
    private String location;
    private Double latitude;
    private Double longitude;
    private CurrentWeather current;
    private List<DailyForecast> forecast;
    private List<WeatherAlert> alerts;
    private LocalDateTime lastUpdated;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentWeather {
        private Double temperature;
        private Double feelsLike;
        private Integer humidity;
        private Double windSpeed;
        private String windDirection;
        private Double pressure;
        private Double uvIndex;
        private Integer visibility;
        private String condition;
        private String conditionIcon;
        private Double precipitation;
        private Integer cloudCover;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyForecast {
        private LocalDate date;
        private Double tempMin;
        private Double tempMax;
        private Double tempAvg;
        private Integer humidity;
        private Double precipitationChance;
        private Double precipitationAmount;
        private Double windSpeed;
        private String condition;
        private String conditionIcon;
        private String sunrise;
        private String sunset;
        private Double uvIndex;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeatherAlert {
        private String type;
        private String severity;
        private String headline;
        private String description;
        private LocalDateTime start;
        private LocalDateTime end;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmingRecommendation {
        private String category;
        private String recommendation;
        private String priority;
        private String reason;
    }
}
