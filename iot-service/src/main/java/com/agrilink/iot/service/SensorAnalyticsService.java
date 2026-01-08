package com.agrilink.iot.service;

import com.agrilink.iot.dto.SensorAnalyticsDto;
import com.agrilink.iot.entity.Alert;
import com.agrilink.iot.entity.Device;
import com.agrilink.iot.entity.Telemetry;
import com.agrilink.iot.repository.AlertRepository;
import com.agrilink.iot.repository.DeviceRepository;
import com.agrilink.iot.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for IoT sensor analytics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SensorAnalyticsService {

    private final DeviceRepository deviceRepository;
    private final TelemetryRepository telemetryRepository;
    private final AlertRepository alertRepository;

    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Get sensor analytics for a farmer.
     */
    public SensorAnalyticsDto getSensorAnalytics(UUID farmerId) {
        log.info("Generating sensor analytics for farmer: {}", farmerId);

        List<Device> devices = deviceRepository.findByFarmerId(farmerId);
        
        // Device counts
        int totalDevices = devices.size();
        int onlineDevices = (int) devices.stream()
                .filter(d -> d.getStatus() == Device.DeviceStatus.ACTIVE)
                .count();
        int offlineDevices = (int) devices.stream()
                .filter(d -> d.getStatus() == Device.DeviceStatus.OFFLINE)
                .count();
        int alertingDevices = (int) devices.stream()
                .filter(d -> d.getStatus() == Device.DeviceStatus.MAINTENANCE)
                .count();

        // Sensor summaries
        List<SensorAnalyticsDto.SensorSummary> sensorSummaries = buildSensorSummaries(devices);

        // Time range for historical data (last 24 hours)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last24Hours = now.minusHours(24);

        // Historical data
        List<SensorAnalyticsDto.TimeSeriesData> temperatureHistory = 
                getHistoricalData(farmerId, Telemetry.MetricType.TEMPERATURE, last24Hours, now);
        List<SensorAnalyticsDto.TimeSeriesData> humidityHistory = 
                getHistoricalData(farmerId, Telemetry.MetricType.HUMIDITY, last24Hours, now);
        List<SensorAnalyticsDto.TimeSeriesData> soilMoistureHistory = 
                getHistoricalData(farmerId, Telemetry.MetricType.SOIL_MOISTURE, last24Hours, now);

        // Current conditions
        SensorAnalyticsDto.CurrentConditions currentConditions = calculateCurrentConditions(devices);

        // Active alerts
        List<Alert> activeAlerts = alertRepository.findByFarmerIdAndAcknowledgedFalse(farmerId);
        List<SensorAnalyticsDto.AlertSummary> alertSummaries = activeAlerts.stream()
                .limit(10)
                .map(alert -> SensorAnalyticsDto.AlertSummary.builder()
                        .alertId(alert.getId())
                        .deviceId(alert.getDevice().getId())
                        .deviceName(getDeviceName(devices, alert.getDevice().getId()))
                        .alertType(alert.getAlertType().name())
                        .severity(alert.getSeverity().name())
                        .message(alert.getMessage())
                        .triggeredAt(alert.getCreatedAt().format(DATETIME_FORMATTER))
                        .acknowledged(alert.isAcknowledged())
                        .build())
                .toList();

        // Alert counts
        long alertsToday = alertRepository.countByFarmerIdAndAcknowledgedFalse(farmerId);
        long alertsThisWeek = alertsToday; // Simplified for now

        return SensorAnalyticsDto.builder()
                .totalDevices(totalDevices)
                .onlineDevices(onlineDevices)
                .offlineDevices(offlineDevices)
                .alertingDevices(alertingDevices)
                .sensorSummaries(sensorSummaries)
                .temperatureHistory(temperatureHistory)
                .humidityHistory(humidityHistory)
                .soilMoistureHistory(soilMoistureHistory)
                .currentConditions(currentConditions)
                .activeAlerts(alertSummaries)
                .totalAlertsToday((int) alertsToday)
                .totalAlertsThisWeek((int) alertsThisWeek)
                .build();
    }

    private List<SensorAnalyticsDto.SensorSummary> buildSensorSummaries(List<Device> devices) {
        return devices.stream()
                .map(device -> {
                    // Get latest telemetry for the device
                    List<Telemetry> latestTelemetry = telemetryRepository.findLatestByDeviceId(
                            device.getId(), PageRequest.of(0, 1));
                    
                    Telemetry latest = latestTelemetry.isEmpty() ? null : latestTelemetry.get(0);

                    return SensorAnalyticsDto.SensorSummary.builder()
                            .deviceId(device.getId())
                            .deviceName(device.getDeviceName())
                            .deviceType(device.getDeviceType().name())
                            .status(device.getStatus().name())
                            .lastReading(latest != null ? latest.getMetricValue() : null)
                            .metricType(latest != null ? latest.getMetricType().name() : null)
                            .unit(latest != null ? latest.getUnit() : null)
                            .lastUpdated(latest != null ? latest.getRecordedAt().format(DATETIME_FORMATTER) : "N/A")
                            .batteryLevel(null) // Device doesn't have battery level
                            .build();
                })
                .toList();
    }

    private List<SensorAnalyticsDto.TimeSeriesData> getHistoricalData(
            UUID farmerId, Telemetry.MetricType metricType, LocalDateTime start, LocalDateTime end) {
        
        List<Telemetry> telemetryData = telemetryRepository.findByFarmerIdAndMetricTypeAndTimeRange(
                farmerId, metricType, start, end);

        // Aggregate data into hourly buckets for cleaner charts
        Map<String, List<Telemetry>> byHour = telemetryData.stream()
                .collect(Collectors.groupingBy(t -> 
                        t.getRecordedAt().withMinute(0).withSecond(0).format(TIME_FORMATTER)));

        return byHour.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    BigDecimal avgValue = entry.getValue().stream()
                            .map(Telemetry::getMetricValue)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);

                    return SensorAnalyticsDto.TimeSeriesData.builder()
                            .timestamp(entry.getKey())
                            .value(avgValue)
                            .metricType(metricType.name())
                            .build();
                })
                .toList();
    }

    private SensorAnalyticsDto.CurrentConditions calculateCurrentConditions(List<Device> devices) {
        Map<Telemetry.MetricType, BigDecimal> latestReadings = new HashMap<>();
        
        for (Device device : devices) {
            List<Telemetry> latest = telemetryRepository.findLatestByDeviceId(
                    device.getId(), PageRequest.of(0, 5));
            
            for (Telemetry t : latest) {
                latestReadings.putIfAbsent(t.getMetricType(), t.getMetricValue());
            }
        }

        // Determine overall status
        String overallStatus = "OPTIMAL";
        BigDecimal temp = latestReadings.get(Telemetry.MetricType.TEMPERATURE);
        BigDecimal humidity = latestReadings.get(Telemetry.MetricType.HUMIDITY);
        BigDecimal soilMoisture = latestReadings.get(Telemetry.MetricType.SOIL_MOISTURE);

        if (temp != null) {
            if (temp.compareTo(BigDecimal.valueOf(35)) > 0 || temp.compareTo(BigDecimal.valueOf(5)) < 0) {
                overallStatus = "CRITICAL";
            } else if (temp.compareTo(BigDecimal.valueOf(30)) > 0 || temp.compareTo(BigDecimal.valueOf(10)) < 0) {
                overallStatus = "WARNING";
            }
        }

        if (soilMoisture != null && "OPTIMAL".equals(overallStatus)) {
            if (soilMoisture.compareTo(BigDecimal.valueOf(20)) < 0) {
                overallStatus = "WARNING";
            }
        }

        return SensorAnalyticsDto.CurrentConditions.builder()
                .temperature(latestReadings.get(Telemetry.MetricType.TEMPERATURE))
                .temperatureUnit("°C")
                .humidity(latestReadings.get(Telemetry.MetricType.HUMIDITY))
                .soilMoisture(latestReadings.get(Telemetry.MetricType.SOIL_MOISTURE))
                .soilPh(latestReadings.get(Telemetry.MetricType.SOIL_PH))
                .lightIntensity(latestReadings.get(Telemetry.MetricType.LIGHT_INTENSITY))
                .rainfall(latestReadings.get(Telemetry.MetricType.RAINFALL))
                .windSpeed(latestReadings.get(Telemetry.MetricType.WIND_SPEED))
                .overallStatus(overallStatus)
                .build();
    }

    private String getDeviceName(List<Device> devices, UUID deviceId) {
        return devices.stream()
                .filter(d -> d.getId().equals(deviceId))
                .map(Device::getDeviceName)
                .findFirst()
                .orElse("Unknown Device");
    }
}
