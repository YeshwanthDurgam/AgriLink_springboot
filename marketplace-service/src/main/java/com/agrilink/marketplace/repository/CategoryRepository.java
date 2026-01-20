package com.agrilink.marketplace.repository;

import com.agrilink.marketplace.dto.CategoryWithCountProjection;
import com.agrilink.marketplace.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Category entity.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findByName(String name);

    List<Category> findByActiveTrue();

    List<Category> findByParentIsNullAndActiveTrue();

    List<Category> findByParentIdAndActiveTrue(UUID parentId);

    boolean existsByName(String name);

    /**
     * Get all active categories that have at least one ACTIVE listing.
     * Uses INNER JOIN to ensure only categories with products are returned.
     * Groups by category and counts products.
     * HAVING clause ensures zero-count categories are never returned.
     */
    @Query("SELECT c.id AS id, c.name AS name, c.description AS description, COUNT(l.id) AS productCount " +
           "FROM Category c " +
           "INNER JOIN Listing l ON l.category.id = c.id " +
           "WHERE c.active = true AND l.status = 'ACTIVE' " +
           "GROUP BY c.id, c.name, c.description " +
           "HAVING COUNT(l.id) > 0 " +
           "ORDER BY c.name")
    List<CategoryWithCountProjection> findCategoriesWithProductCount();
}
