package com.agrilink.farm.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.farm.dto.CreateFieldRequest;
import com.agrilink.farm.dto.FieldDto;
import com.agrilink.farm.entity.Farm;
import com.agrilink.farm.entity.Field;
import com.agrilink.farm.repository.FarmRepository;
import com.agrilink.farm.repository.FieldRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FieldService.
 */
@ExtendWith(MockitoExtension.class)
class FieldServiceTest {

    @Mock
    private FieldRepository fieldRepository;

    @Mock
    private FarmRepository farmRepository;

    @InjectMocks
    private FieldService fieldService;

    private UUID farmId;
    private UUID farmerId;
    private UUID fieldId;
    private Farm farm;
    private Field field;
    private CreateFieldRequest createFieldRequest;

    @BeforeEach
    void setUp() {
        farmId = UUID.randomUUID();
        farmerId = UUID.randomUUID();
        fieldId = UUID.randomUUID();

        farm = Farm.builder()
                .id(farmId)
                .farmerId(farmerId)
                .name("Test Farm")
                .build();

        field = Field.builder()
                .id(fieldId)
                .farm(farm)
                .name("Field A")
                .area(new BigDecimal("10.5"))
                .areaUnit("HECTARE")
                .soilType("LOAMY")
                .irrigationType("DRIP")
                .active(true)
                .cropPlans(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        createFieldRequest = CreateFieldRequest.builder()
                .name("Field A")
                .area(new BigDecimal("10.5"))
                .areaUnit("HECTARE")
                .soilType("LOAMY")
                .irrigationType("DRIP")
                .build();
    }

    @Nested
    @DisplayName("Create Field")
    class CreateFieldTests {

        @Test
        @DisplayName("Should create field successfully")
        void shouldCreateFieldSuccessfully() {
            when(farmRepository.findByIdAndFarmerId(farmId, farmerId)).thenReturn(Optional.of(farm));
            when(fieldRepository.save(any(Field.class))).thenReturn(field);

            FieldDto result = fieldService.createField(farmId, farmerId, createFieldRequest);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Field A");
            assertThat(result.getArea()).isEqualByComparingTo(new BigDecimal("10.5"));
            verify(fieldRepository).save(any(Field.class));
        }

        @Test
        @DisplayName("Should throw exception when farm not found")
        void shouldThrowExceptionWhenFarmNotFound() {
            when(farmRepository.findByIdAndFarmerId(farmId, farmerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> fieldService.createField(farmId, farmerId, createFieldRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should use default area unit when not provided")
        void shouldUseDefaultAreaUnitWhenNotProvided() {
            createFieldRequest.setAreaUnit(null);
            when(farmRepository.findByIdAndFarmerId(farmId, farmerId)).thenReturn(Optional.of(farm));
            when(fieldRepository.save(any(Field.class))).thenReturn(field);

            FieldDto result = fieldService.createField(farmId, farmerId, createFieldRequest);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Fields by Farm")
    class GetFieldsByFarmTests {

        @Test
        @DisplayName("Should return all active fields for farm")
        void shouldReturnAllActiveFieldsForFarm() {
            when(fieldRepository.findByFarmIdAndActiveTrue(farmId)).thenReturn(List.of(field));

            List<FieldDto> result = fieldService.getFieldsByFarm(farmId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Field A");
        }

        @Test
        @DisplayName("Should return empty list when no fields")
        void shouldReturnEmptyListWhenNoFields() {
            when(fieldRepository.findByFarmIdAndActiveTrue(farmId)).thenReturn(List.of());

            List<FieldDto> result = fieldService.getFieldsByFarm(farmId);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return multiple fields")
        void shouldReturnMultipleFields() {
            Field field2 = Field.builder()
                    .id(UUID.randomUUID())
                    .farm(farm)
                    .name("Field B")
                    .area(new BigDecimal("5.0"))
                    .areaUnit("HECTARE")
                    .active(true)
                    .cropPlans(new ArrayList<>())
                    .build();

            when(fieldRepository.findByFarmIdAndActiveTrue(farmId)).thenReturn(List.of(field, field2));

            List<FieldDto> result = fieldService.getFieldsByFarm(farmId);

            assertThat(result).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Get Field by ID")
    class GetFieldByIdTests {

        @Test
        @DisplayName("Should return field when found")
        void shouldReturnFieldWhenFound() {
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.of(field));

            FieldDto result = fieldService.getField(fieldId);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(fieldId);
            assertThat(result.getName()).isEqualTo("Field A");
        }

        @Test
        @DisplayName("Should throw exception when field not found")
        void shouldThrowExceptionWhenFieldNotFound() {
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> fieldService.getField(fieldId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Update Field")
    class UpdateFieldTests {

        @Test
        @DisplayName("Should update field successfully")
        void shouldUpdateFieldSuccessfully() {
            createFieldRequest.setName("Updated Field A");
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.of(field));
            when(fieldRepository.save(any(Field.class))).thenReturn(field);

            FieldDto result = fieldService.updateField(fieldId, createFieldRequest);

            assertThat(result).isNotNull();
            verify(fieldRepository).save(any(Field.class));
        }

        @Test
        @DisplayName("Should throw exception when field not found")
        void shouldThrowExceptionWhenFieldNotFound() {
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> fieldService.updateField(fieldId, createFieldRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should update only provided fields")
        void shouldUpdateOnlyProvidedFields() {
            CreateFieldRequest partialRequest = CreateFieldRequest.builder()
                    .name("Updated Name")
                    .build();
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.of(field));
            when(fieldRepository.save(any(Field.class))).thenReturn(field);

            fieldService.updateField(fieldId, partialRequest);

            assertThat(field.getName()).isEqualTo("Updated Name");
            assertThat(field.getArea()).isEqualByComparingTo(new BigDecimal("10.5"));
        }
    }

    @Nested
    @DisplayName("Delete Field")
    class DeleteFieldTests {

        @Test
        @DisplayName("Should soft delete field")
        void shouldSoftDeleteField() {
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.of(field));
            when(fieldRepository.save(any(Field.class))).thenReturn(field);

            fieldService.deleteField(fieldId);

            assertThat(field.isActive()).isFalse();
            verify(fieldRepository).save(field);
        }

        @Test
        @DisplayName("Should throw exception when field not found")
        void shouldThrowExceptionWhenFieldNotFound() {
            when(fieldRepository.findById(fieldId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> fieldService.deleteField(fieldId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
