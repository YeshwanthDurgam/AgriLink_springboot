package com.agrilink.marketplace.dto;

import java.util.UUID;

/**
 * Projection interface for category with product count aggregation.
 */
public interface CategoryWithCountProjection {
    UUID getId();
    String getName();
    String getDescription();
    Long getProductCount();
}
