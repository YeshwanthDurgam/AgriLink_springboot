package com.agrilink.farm.service;

import com.agrilink.farm.dto.WeatherDto;
import com.agrilink.farm.dto.WeatherDto.*;
import com.agrilink.farm.entity.Farm;
import com.agrilink.farm.repository.FarmRepository;
import com.agrilink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for weather data integration.
 * Uses Open-Meteo API (free, no API key required).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    private final FarmRepository farmRepository;
    private final RestTemplate restTemplate;

    private static final String OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

    /**
     * Get weather data for a specific farm.
     */
    public WeatherDto getWeatherForFarm(UUID farmId) {
        log.info("Fetching weather for farm: {}", farmId);
        
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));
        
        // Parse coordinates from farm location or use defaults
        double[] coords = parseCoordinates(farm.getLocation(), farm.getLatitude(), farm.getLongitude());
        
        return fetchWeatherData(coords[0], coords[1], farm.getLocation());
    }

    /**
     * Get weather data for coordinates.
     */
    public WeatherDto getWeatherForLocation(Double latitude, Double longitude) {
        log.info("Fetching weather for coordinates: {}, {}", latitude, longitude);
        return fetchWeatherData(latitude, longitude, String.format("%.4f, %.4f", latitude, longitude));
    }

    /**
     * Get farming recommendations based on weather.
     */
    public List<FarmingRecommendation> getFarmingRecommendations(UUID farmId) {
        WeatherDto weather = getWeatherForFarm(farmId);
        return generateRecommendations(weather);
    }

    private WeatherDto fetchWeatherData(double latitude, double longitude, String locationName) {
        try {
            String url = String.format(
                "%s?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7",
                OPEN_METEO_API, latitude, longitude
            );
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            return parseWeatherResponse(response, locationName, latitude, longitude);
        } catch (Exception e) {
            log.error("Error fetching weather data: {}", e.getMessage());
            // Return mock data if API fails
            return createMockWeatherData(locationName, latitude, longitude);
        }
    }

    @SuppressWarnings("unchecked")
    private WeatherDto parseWeatherResponse(Map<String, Object> response, String location, double lat, double lon) {
        Map<String, Object> current = (Map<String, Object>) response.get("current");
        Map<String, Object> daily = (Map<String, Object>) response.get("daily");
        
        // Parse current weather
        CurrentWeather currentWeather = CurrentWeather.builder()
                .temperature(getDouble(current, "temperature_2m"))
                .feelsLike(getDouble(current, "apparent_temperature"))
                .humidity(getInt(current, "relative_humidity_2m"))
                .windSpeed(getDouble(current, "wind_speed_10m"))
                .windDirection(getWindDirection(getInt(current, "wind_direction_10m")))
                .pressure(getDouble(current, "pressure_msl"))
                .precipitation(getDouble(current, "precipitation"))
                .cloudCover(getInt(current, "cloud_cover"))
                .condition(getWeatherCondition(getInt(current, "weather_code")))
                .conditionIcon(getWeatherIcon(getInt(current, "weather_code")))
                .build();
        
        // Parse daily forecast
        List<DailyForecast> forecasts = new ArrayList<>();
        List<String> dates = (List<String>) daily.get("time");
        List<Number> tempMaxList = (List<Number>) daily.get("temperature_2m_max");
        List<Number> tempMinList = (List<Number>) daily.get("temperature_2m_min");
        List<Number> weatherCodes = (List<Number>) daily.get("weather_code");
        List<Number> precipProb = (List<Number>) daily.get("precipitation_probability_max");
        List<Number> precipSum = (List<Number>) daily.get("precipitation_sum");
        List<Number> windMax = (List<Number>) daily.get("wind_speed_10m_max");
        List<Number> uvIndex = (List<Number>) daily.get("uv_index_max");
        List<String> sunrises = (List<String>) daily.get("sunrise");
        List<String> sunsets = (List<String>) daily.get("sunset");
        
        for (int i = 0; i < Math.min(dates.size(), 7); i++) {
            int code = weatherCodes.get(i).intValue();
            forecasts.add(DailyForecast.builder()
                    .date(LocalDate.parse(dates.get(i)))
                    .tempMax(tempMaxList.get(i).doubleValue())
                    .tempMin(tempMinList.get(i).doubleValue())
                    .tempAvg((tempMaxList.get(i).doubleValue() + tempMinList.get(i).doubleValue()) / 2)
                    .precipitationChance(precipProb != null ? precipProb.get(i).doubleValue() : 0)
                    .precipitationAmount(precipSum != null ? precipSum.get(i).doubleValue() : 0)
                    .windSpeed(windMax != null ? windMax.get(i).doubleValue() : 0)
                    .uvIndex(uvIndex != null ? uvIndex.get(i).doubleValue() : 0)
                    .condition(getWeatherCondition(code))
                    .conditionIcon(getWeatherIcon(code))
                    .sunrise(sunrises != null ? sunrises.get(i).substring(11) : "06:00")
                    .sunset(sunsets != null ? sunsets.get(i).substring(11) : "18:00")
                    .build());
        }
        
        return WeatherDto.builder()
                .location(location)
                .latitude(lat)
                .longitude(lon)
                .current(currentWeather)
                .forecast(forecasts)
                .alerts(new ArrayList<>())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    private List<FarmingRecommendation> generateRecommendations(WeatherDto weather) {
        List<FarmingRecommendation> recommendations = new ArrayList<>();
        CurrentWeather current = weather.getCurrent();
        
        // Temperature-based recommendations
        if (current.getTemperature() != null) {
            if (current.getTemperature() < 5) {
                recommendations.add(FarmingRecommendation.builder()
                        .category("Frost Protection")
                        .recommendation("Protect sensitive crops from frost. Consider covering or using frost cloth.")
                        .priority("HIGH")
                        .reason("Temperature below 5°C")
                        .build());
            } else if (current.getTemperature() > 35) {
                recommendations.add(FarmingRecommendation.builder()
                        .category("Heat Stress")
                        .recommendation("Increase irrigation frequency. Provide shade for sensitive crops.")
                        .priority("HIGH")
                        .reason("Temperature above 35°C")
                        .build());
            }
        }
        
        // Precipitation recommendations
        if (weather.getForecast() != null && !weather.getForecast().isEmpty()) {
            double totalPrecip = weather.getForecast().stream()
                    .limit(3)
                    .mapToDouble(f -> f.getPrecipitationAmount() != null ? f.getPrecipitationAmount() : 0)
                    .sum();
            
            if (totalPrecip > 50) {
                recommendations.add(FarmingRecommendation.builder()
                        .category("Drainage")
                        .recommendation("Heavy rain expected. Check drainage systems and protect harvested crops.")
                        .priority("HIGH")
                        .reason("Expected precipitation: " + String.format("%.1f mm", totalPrecip))
                        .build());
            } else if (totalPrecip < 5) {
                recommendations.add(FarmingRecommendation.builder()
                        .category("Irrigation")
                        .recommendation("Dry conditions expected. Plan irrigation schedule accordingly.")
                        .priority("MEDIUM")
                        .reason("Low precipitation expected")
                        .build());
            }
        }
        
        // Wind recommendations
        if (current.getWindSpeed() != null && current.getWindSpeed() > 30) {
            recommendations.add(FarmingRecommendation.builder()
                    .category("Wind Protection")
                    .recommendation("High winds expected. Secure loose materials and delay spraying activities.")
                    .priority("MEDIUM")
                    .reason("Wind speed: " + String.format("%.1f km/h", current.getWindSpeed()))
                    .build());
        }
        
        // Humidity recommendations
        if (current.getHumidity() != null) {
            if (current.getHumidity() > 85) {
                recommendations.add(FarmingRecommendation.builder()
                        .category("Disease Prevention")
                        .recommendation("High humidity increases fungal disease risk. Monitor crops for signs of infection.")
                        .priority("MEDIUM")
                        .reason("Humidity: " + current.getHumidity() + "%")
                        .build());
            }
        }
        
        // Default good weather recommendation
        if (recommendations.isEmpty()) {
            recommendations.add(FarmingRecommendation.builder()
                    .category("General")
                    .recommendation("Weather conditions are favorable for most farming activities.")
                    .priority("LOW")
                    .reason("No adverse weather conditions detected")
                    .build());
        }
        
        return recommendations;
    }

    private double[] parseCoordinates(String location, java.math.BigDecimal lat, java.math.BigDecimal lon) {
        // Use provided coordinates if available
        if (lat != null && lon != null) {
            return new double[]{lat.doubleValue(), lon.doubleValue()};
        }
        
        // Default coordinates (can be enhanced with geocoding)
        // Using central coordinates as default
        return new double[]{20.5937, 78.9629}; // India center as default
    }

    private WeatherDto createMockWeatherData(String location, double lat, double lon) {
        CurrentWeather current = CurrentWeather.builder()
                .temperature(25.0)
                .feelsLike(26.0)
                .humidity(65)
                .windSpeed(12.0)
                .windDirection("NW")
                .pressure(1013.0)
                .uvIndex(5.0)
                .visibility(10)
                .condition("Partly Cloudy")
                .conditionIcon("⛅")
                .precipitation(0.0)
                .cloudCover(40)
                .build();
        
        List<DailyForecast> forecasts = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            forecasts.add(DailyForecast.builder()
                    .date(LocalDate.now().plusDays(i))
                    .tempMin(20.0 + Math.random() * 5)
                    .tempMax(28.0 + Math.random() * 5)
                    .tempAvg(24.0 + Math.random() * 3)
                    .humidity(60 + (int)(Math.random() * 20))
                    .precipitationChance(Math.random() * 50)
                    .precipitationAmount(Math.random() * 10)
                    .windSpeed(10 + Math.random() * 10)
                    .condition(i % 3 == 0 ? "Sunny" : i % 3 == 1 ? "Partly Cloudy" : "Cloudy")
                    .conditionIcon(i % 3 == 0 ? "☀️" : i % 3 == 1 ? "⛅" : "☁️")
                    .sunrise("06:15")
                    .sunset("18:30")
                    .uvIndex(5 + Math.random() * 3)
                    .build());
        }
        
        return WeatherDto.builder()
                .location(location)
                .latitude(lat)
                .longitude(lon)
                .current(current)
                .forecast(forecasts)
                .alerts(new ArrayList<>())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }

    private Integer getInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    private String getWindDirection(Integer degrees) {
        if (degrees == null) return "N";
        String[] directions = {"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"};
        return directions[(int) Math.round(((double) degrees % 360) / 22.5) % 16];
    }

    private String getWeatherCondition(Integer code) {
        if (code == null) return "Unknown";
        if (code == 0) return "Clear Sky";
        if (code <= 3) return "Partly Cloudy";
        if (code <= 49) return "Foggy";
        if (code <= 59) return "Drizzle";
        if (code <= 69) return "Rain";
        if (code <= 79) return "Snow";
        if (code <= 84) return "Rain Showers";
        if (code <= 94) return "Snow Showers";
        if (code <= 99) return "Thunderstorm";
        return "Unknown";
    }

    private String getWeatherIcon(Integer code) {
        if (code == null) return "❓";
        if (code == 0) return "☀️";
        if (code <= 3) return "⛅";
        if (code <= 49) return "🌫️";
        if (code <= 59) return "🌧️";
        if (code <= 69) return "🌧️";
        if (code <= 79) return "🌨️";
        if (code <= 84) return "🌦️";
        if (code <= 94) return "🌨️";
        if (code <= 99) return "⛈️";
        return "❓";
    }
}
