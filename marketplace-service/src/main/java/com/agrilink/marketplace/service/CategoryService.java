package com.agrilink.marketplace.service;

import com.agrilink.common.exception.ResourceNotFoundException;
import com.agrilink.marketplace.dto.CategoryDto;
import com.agrilink.marketplace.dto.CategoryWithCountProjection;
import com.agrilink.marketplace.entity.Category;
import com.agrilink.marketplace.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for category operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Get all categories that have at least one active product.
     * Uses a single aggregation query with INNER JOIN - no in-memory filtering.
     * Categories with zero products are NEVER returned.
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        List<CategoryWithCountProjection> categoriesWithCount = categoryRepository.findCategoriesWithProductCount();
        return categoriesWithCount.stream()
                .map(this::projectionToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all root categories (no parent) that have at least one active product.
     * Reuses the same aggregation query to ensure consistency.
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getRootCategories() {
        // Use the same aggregation query - all returned categories have products
        return getAllCategories();
    }

    /**
     * Get category by ID.
     */
    @Transactional(readOnly = true)
    public CategoryDto getCategory(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        return mapToDto(category);
    }

    /**
     * Get subcategories.
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getSubcategories(UUID parentId) {
        return categoryRepository.findByParentIdAndActiveTrue(parentId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert projection (from aggregation query) to DTO.
     * productCount is guaranteed to be >= 1 by the HAVING clause.
     */
    private CategoryDto projectionToDto(CategoryWithCountProjection projection) {
        return CategoryDto.builder()
                .id(projection.getId())
                .name(projection.getName())
                .description(projection.getDescription())
                .active(true)
                .productCount(projection.getProductCount())
                .build();
    }

    /**
     * Map entity to DTO (for single category lookup).
     */
    private CategoryDto mapToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .active(category.isActive())
                .build();
    }
}
