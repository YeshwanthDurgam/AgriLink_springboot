package com.agrilink.marketplace.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.marketplace.dto.CategoryDto;
import com.agrilink.marketplace.dto.CategoryWithCountProjection;
import com.agrilink.marketplace.entity.Category;
import com.agrilink.marketplace.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CategoryService.
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private UUID categoryId;
    private Category category;
    private CategoryWithCountProjection projection;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();

        category = Category.builder()
                .id(categoryId)
                .name("Vegetables")
                .description("Fresh vegetables")
                .active(true)
                .build();

        projection = new CategoryWithCountProjection() {
            @Override
            public UUID getId() {
                return categoryId;
            }

            @Override
            public String getName() {
                return "Vegetables";
            }

            @Override
            public String getDescription() {
                return "Fresh vegetables";
            }

            @Override
            public Long getProductCount() {
                return 10L;
            }
        };
    }

    @Nested
    @DisplayName("Get All Categories")
    class GetAllCategoriesTests {

        @Test
        @DisplayName("Should return all categories with product count")
        void shouldReturnAllCategoriesWithProductCount() {
            when(categoryRepository.findCategoriesWithProductCount())
                    .thenReturn(List.of(projection));

            List<CategoryDto> result = categoryService.getAllCategories();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Vegetables");
            assertThat(result.get(0).getProductCount()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Should return empty list when no categories have products")
        void shouldReturnEmptyListWhenNoCategoriesHaveProducts() {
            when(categoryRepository.findCategoriesWithProductCount())
                    .thenReturn(List.of());

            List<CategoryDto> result = categoryService.getAllCategories();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return multiple categories")
        void shouldReturnMultipleCategories() {
            CategoryWithCountProjection fruitProjection = new CategoryWithCountProjection() {
                @Override
                public UUID getId() {
                    return UUID.randomUUID();
                }

                @Override
                public String getName() {
                    return "Fruits";
                }

                @Override
                public String getDescription() {
                    return "Fresh fruits";
                }

                @Override
                public Long getProductCount() {
                    return 5L;
                }
            };

            when(categoryRepository.findCategoriesWithProductCount())
                    .thenReturn(List.of(projection, fruitProjection));

            List<CategoryDto> result = categoryService.getAllCategories();

            assertThat(result).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Get Root Categories")
    class GetRootCategoriesTests {

        @Test
        @DisplayName("Should return root categories")
        void shouldReturnRootCategories() {
            when(categoryRepository.findByParentIsNullAndActiveTrue())
                    .thenReturn(List.of(category));

            List<CategoryDto> result = categoryService.getRootCategories();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Vegetables");
        }
    }

    @Nested
    @DisplayName("Get Category by ID")
    class GetCategoryByIdTests {

        @Test
        @DisplayName("Should return category when found")
        void shouldReturnCategoryWhenFound() {
            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

            CategoryDto result = categoryService.getCategory(categoryId);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Vegetables");
            assertThat(result.isActive()).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when category not found")
        void shouldThrowExceptionWhenNotFound() {
            when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.getCategory(categoryId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Get Subcategories")
    class GetSubcategoriesTests {

        @Test
        @DisplayName("Should return subcategories for parent")
        void shouldReturnSubcategoriesForParent() {
            UUID parentId = UUID.randomUUID();
            Category subcategory = Category.builder()
                    .id(UUID.randomUUID())
                    .name("Leafy Vegetables")
                    .description("Green leafy vegetables")
                    .parent(category)
                    .active(true)
                    .build();

            when(categoryRepository.findByParentIdAndActiveTrue(parentId))
                    .thenReturn(List.of(subcategory));

            List<CategoryDto> result = categoryService.getSubcategories(parentId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Leafy Vegetables");
        }

        @Test
        @DisplayName("Should return empty list when no subcategories")
        void shouldReturnEmptyListWhenNoSubcategories() {
            UUID parentId = UUID.randomUUID();
            when(categoryRepository.findByParentIdAndActiveTrue(parentId))
                    .thenReturn(List.of());

            List<CategoryDto> result = categoryService.getSubcategories(parentId);

            assertThat(result).isEmpty();
        }
    }
}
