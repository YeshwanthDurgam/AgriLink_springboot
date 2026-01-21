package com.agrilink.iot.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.iot.dto.AlertDto;
import com.agrilink.iot.entity.Alert;
import com.agrilink.iot.entity.AlertRule;
import com.agrilink.iot.entity.Device;
import com.agrilink.iot.entity.Telemetry;
import com.agrilink.iot.repository.AlertRepository;
import com.agrilink.iot.repository.AlertRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AlertService.
 */
@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AlertRuleRepository alertRuleRepository;

    @InjectMocks
    private AlertService alertService;

    private UUID deviceId;
    private UUID farmerId;
    private UUID alertId;
    private Device device;
    private Alert alert;
    private AlertRule alertRule;

    @BeforeEach
    void setUp() {
        deviceId = UUID.randomUUID();
        farmerId = UUID.randomUUID();
        alertId = UUID.randomUUID();

        device = Device.builder()
                .id(deviceId)
                .farmerId(farmerId)
                .deviceName("Sensor-001")
                .deviceType(Device.DeviceType.SOIL_SENSOR)
                .status(Device.DeviceStatus.ACTIVE)
                .build();

        alert = Alert.builder()
                .id(alertId)
                .device(device)
                .farmerId(farmerId)
                .alertType(Alert.AlertType.THRESHOLD_EXCEEDED)
                .severity(Alert.Severity.CRITICAL)
                .message("Temperature exceeded threshold")
                .metricType(Telemetry.MetricType.TEMPERATURE)
                .metricValue(new BigDecimal("35.0"))
                .thresholdValue(new BigDecimal("30.0"))
                .acknowledged(false)
                .createdAt(LocalDateTime.now())
                .build();

        alertRule = AlertRule.builder()
                .id(UUID.randomUUID())
                .device(device)
                .metricType(Telemetry.MetricType.TEMPERATURE)
                .condition(AlertRule.Condition.GREATER_THAN)
                .thresholdValue(new BigDecimal("30.0"))
                .severity(Alert.Severity.CRITICAL)
                .enabled(true)
                .build();
    }

    @Nested
    @DisplayName("Check Alert Rules")
    class CheckAlertRulesTests {

        @Test
        @DisplayName("Should create alert when threshold exceeded")
        void shouldCreateAlertWhenThresholdExceeded() {
            when(alertRuleRepository.findByDeviceIdAndMetricTypeAndEnabledTrue(
                    deviceId, Telemetry.MetricType.TEMPERATURE))
                    .thenReturn(List.of(alertRule));
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);

            alertService.checkAlertRules(device, Telemetry.MetricType.TEMPERATURE, new BigDecimal("35.0"));

            verify(alertRepository).save(any(Alert.class));
        }

        @Test
        @DisplayName("Should not create alert when threshold not exceeded")
        void shouldNotCreateAlertWhenThresholdNotExceeded() {
            when(alertRuleRepository.findByDeviceIdAndMetricTypeAndEnabledTrue(
                    deviceId, Telemetry.MetricType.TEMPERATURE))
                    .thenReturn(List.of(alertRule));

            alertService.checkAlertRules(device, Telemetry.MetricType.TEMPERATURE, new BigDecimal("25.0"));

            verify(alertRepository, never()).save(any(Alert.class));
        }

        @Test
        @DisplayName("Should handle multiple alert rules")
        void shouldHandleMultipleAlertRules() {
            AlertRule secondRule = AlertRule.builder()
                    .id(UUID.randomUUID())
                    .device(device)
                    .metricType(Telemetry.MetricType.TEMPERATURE)
                    .condition(AlertRule.Condition.GREATER_OR_EQUAL)
                    .thresholdValue(new BigDecimal("30.0"))
                    .severity(Alert.Severity.WARNING)
                    .enabled(true)
                    .build();

            when(alertRuleRepository.findByDeviceIdAndMetricTypeAndEnabledTrue(
                    deviceId, Telemetry.MetricType.TEMPERATURE))
                    .thenReturn(List.of(alertRule, secondRule));
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);

            alertService.checkAlertRules(device, Telemetry.MetricType.TEMPERATURE, new BigDecimal("35.0"));

            verify(alertRepository, times(2)).save(any(Alert.class));
        }
    }

    @Nested
    @DisplayName("Get Alerts by Farmer")
    class GetAlertsByFarmerTests {

        @Test
        @DisplayName("Should return alerts for farmer")
        void shouldReturnAlertsForFarmer() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Alert> page = new PageImpl<>(List.of(alert));
            when(alertRepository.findByFarmerId(farmerId, pageable)).thenReturn(page);

            Page<AlertDto> result = alertService.getAlertsByFarmer(farmerId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getSeverity()).isEqualTo(Alert.Severity.CRITICAL);
        }
    }

    @Nested
    @DisplayName("Get Unacknowledged Alerts")
    class GetUnacknowledgedAlertsTests {

        @Test
        @DisplayName("Should return unacknowledged alerts")
        void shouldReturnUnacknowledgedAlerts() {
            when(alertRepository.findByFarmerIdAndAcknowledgedFalse(farmerId))
                    .thenReturn(List.of(alert));

            List<AlertDto> result = alertService.getUnacknowledgedAlerts(farmerId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).isAcknowledged()).isFalse();
        }

        @Test
        @DisplayName("Should return empty list when all acknowledged")
        void shouldReturnEmptyListWhenAllAcknowledged() {
            when(alertRepository.findByFarmerIdAndAcknowledgedFalse(farmerId))
                    .thenReturn(List.of());

            List<AlertDto> result = alertService.getUnacknowledgedAlerts(farmerId);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Unacknowledged Alert Count")
    class GetUnacknowledgedAlertCountTests {

        @Test
        @DisplayName("Should return correct count")
        void shouldReturnCorrectCount() {
            when(alertRepository.countByFarmerIdAndAcknowledgedFalse(farmerId)).thenReturn(5L);

            long count = alertService.getUnacknowledgedAlertCount(farmerId);

            assertThat(count).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Acknowledge Alert")
    class AcknowledgeAlertTests {

        @Test
        @DisplayName("Should acknowledge alert successfully")
        void shouldAcknowledgeAlertSuccessfully() {
            UUID userId = UUID.randomUUID();
            when(alertRepository.findById(alertId)).thenReturn(Optional.of(alert));
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);

            AlertDto result = alertService.acknowledgeAlert(alertId, userId);

            assertThat(result).isNotNull();
            assertThat(alert.isAcknowledged()).isTrue();
            assertThat(alert.getAcknowledgedBy()).isEqualTo(userId);
            verify(alertRepository).save(alert);
        }

        @Test
        @DisplayName("Should throw exception when alert not found")
        void shouldThrowExceptionWhenAlertNotFound() {
            UUID userId = UUID.randomUUID();
            when(alertRepository.findById(alertId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> alertService.acknowledgeAlert(alertId, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Alerts by Device")
    class GetAlertsByDeviceTests {

        @Test
        @DisplayName("Should return alerts for device")
        void shouldReturnAlertsForDevice() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Alert> page = new PageImpl<>(List.of(alert));
            when(alertRepository.findByDeviceId(deviceId, pageable)).thenReturn(page);

            Page<AlertDto> result = alertService.getAlertsByDevice(deviceId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }
}
