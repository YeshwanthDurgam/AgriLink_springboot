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
     * Get all active categories.
     * Returns all categories with product counts (0 if no products).
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        log.info("Fetching all categories");
        // First try to get categories with product count
        List<CategoryWithCountProjection> categoriesWithCount = categoryRepository.findCategoriesWithProductCount();
        
        // If no categories with products, return all active categories with count 0
        if (categoriesWithCount.isEmpty()) {
            log.info("No categories with active products found, returning all active categories");
            return categoryRepository.findByActiveTrue().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }
        
        return categoriesWithCount.stream()
                .map(this::projectionToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all root categories (no parent).
     * Returns all active root categories.
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getRootCategories() {
        log.info("Fetching root categories");
        return categoryRepository.findByParentIsNullAndActiveTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
