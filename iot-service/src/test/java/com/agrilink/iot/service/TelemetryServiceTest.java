package com.agrilink.iot.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.iot.dto.TelemetryDto;
import com.agrilink.iot.dto.TelemetryIngestRequest;
import com.agrilink.iot.entity.Device;
import com.agrilink.iot.entity.Telemetry;
import com.agrilink.iot.repository.DeviceRepository;
import com.agrilink.iot.repository.TelemetryRepository;
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
 * Unit tests for TelemetryService.
 */
@ExtendWith(MockitoExtension.class)
class TelemetryServiceTest {

    @Mock
    private TelemetryRepository telemetryRepository;

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private DeviceService deviceService;

    @Mock
    private AlertService alertService;

    @InjectMocks
    private TelemetryService telemetryService;

    private UUID deviceId;
    private UUID farmerId;
    private Device device;
    private Telemetry telemetry;
    private TelemetryIngestRequest ingestRequest;

    @BeforeEach
    void setUp() {
        deviceId = UUID.randomUUID();
        farmerId = UUID.randomUUID();

        device = Device.builder()
                .id(deviceId)
                .farmerId(farmerId)
                .deviceName("Sensor-001")
                .deviceType(Device.DeviceType.SOIL_SENSOR)
                .status(Device.DeviceStatus.ACTIVE)
                .build();

        telemetry = Telemetry.builder()
                .id(UUID.randomUUID())
                .device(device)
                .metricType(Telemetry.MetricType.TEMPERATURE)
                .metricValue(new BigDecimal("25.5"))
                .unit("CELSIUS")
                .recordedAt(LocalDateTime.now())
                .build();

        ingestRequest = TelemetryIngestRequest.builder()
                .deviceId(deviceId)
                .metricType(Telemetry.MetricType.TEMPERATURE)
                .metricValue(new BigDecimal("25.5"))
                .unit("CELSIUS")
                .recordedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Ingest Telemetry")
    class IngestTelemetryTests {

        @Test
        @DisplayName("Should ingest telemetry successfully")
        void shouldIngestTelemetrySuccessfully() {
            when(deviceRepository.findById(deviceId)).thenReturn(Optional.of(device));
            when(telemetryRepository.save(any(Telemetry.class))).thenReturn(telemetry);
            doNothing().when(deviceService).updateLastSeen(deviceId);
            doNothing().when(alertService).checkAlertRules(any(), any(), any());

            TelemetryDto result = telemetryService.ingestTelemetry(ingestRequest);

            assertThat(result).isNotNull();
            assertThat(result.getMetricType()).isEqualTo(Telemetry.MetricType.TEMPERATURE);
            assertThat(result.getMetricValue()).isEqualByComparingTo(new BigDecimal("25.5"));
            verify(telemetryRepository).save(any(Telemetry.class));
            verify(deviceService).updateLastSeen(deviceId);
            verify(alertService).checkAlertRules(device, Telemetry.MetricType.TEMPERATURE, new BigDecimal("25.5"));
        }

        @Test
        @DisplayName("Should throw exception when device not found")
        void shouldThrowExceptionWhenDeviceNotFound() {
            when(deviceRepository.findById(deviceId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> telemetryService.ingestTelemetry(ingestRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should use current time when recordedAt not provided")
        void shouldUseCurrentTimeWhenRecordedAtNotProvided() {
            ingestRequest.setRecordedAt(null);
            when(deviceRepository.findById(deviceId)).thenReturn(Optional.of(device));
            when(telemetryRepository.save(any(Telemetry.class))).thenReturn(telemetry);
            doNothing().when(deviceService).updateLastSeen(deviceId);
            doNothing().when(alertService).checkAlertRules(any(), any(), any());

            TelemetryDto result = telemetryService.ingestTelemetry(ingestRequest);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Telemetry by Device")
    class GetTelemetryByDeviceTests {

        @Test
        @DisplayName("Should return telemetry for device")
        void shouldReturnTelemetryForDevice() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Telemetry> page = new PageImpl<>(List.of(telemetry));
            when(telemetryRepository.findByDeviceId(deviceId, pageable)).thenReturn(page);

            Page<TelemetryDto> result = telemetryService.getTelemetryByDevice(deviceId, pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getMetricType()).isEqualTo(Telemetry.MetricType.TEMPERATURE);
        }

        @Test
        @DisplayName("Should return empty page when no telemetry")
        void shouldReturnEmptyPageWhenNoTelemetry() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Telemetry> emptyPage = Page.empty();
            when(telemetryRepository.findByDeviceId(deviceId, pageable)).thenReturn(emptyPage);

            Page<TelemetryDto> result = telemetryService.getTelemetryByDevice(deviceId, pageable);

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Telemetry by Time Range")
    class GetTelemetryByTimeRangeTests {

        @Test
        @DisplayName("Should return telemetry within time range")
        void shouldReturnTelemetryWithinTimeRange() {
            LocalDateTime start = LocalDateTime.now().minusHours(1);
            LocalDateTime end = LocalDateTime.now();
            when(telemetryRepository.findByDeviceIdAndTimeRange(deviceId, start, end))
                    .thenReturn(List.of(telemetry));

            List<TelemetryDto> result = telemetryService.getTelemetryByDeviceAndTimeRange(deviceId, start, end);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Get Telemetry by Metric Type")
    class GetTelemetryByMetricTypeTests {

        @Test
        @DisplayName("Should return telemetry for specific metric type")
        void shouldReturnTelemetryForSpecificMetricType() {
            LocalDateTime start = LocalDateTime.now().minusHours(1);
            LocalDateTime end = LocalDateTime.now();
            when(telemetryRepository.findByDeviceIdAndMetricTypeAndTimeRange(
                    deviceId, Telemetry.MetricType.TEMPERATURE, start, end))
                    .thenReturn(List.of(telemetry));

            List<TelemetryDto> result = telemetryService.getTelemetryByDeviceAndMetricType(
                    deviceId, Telemetry.MetricType.TEMPERATURE, start, end);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getMetricType()).isEqualTo(Telemetry.MetricType.TEMPERATURE);
        }
    }

    @Nested
    @DisplayName("Get Latest Telemetry")
    class GetLatestTelemetryTests {

        @Test
        @DisplayName("Should return latest telemetry readings")
        void shouldReturnLatestTelemetryReadings() {
            when(telemetryRepository.findLatestByDeviceId(deviceId, PageRequest.of(0, 5)))
                    .thenReturn(List.of(telemetry));

            List<TelemetryDto> result = telemetryService.getLatestTelemetry(deviceId, 5);

            assertThat(result).hasSize(1);
        }
    }
}
