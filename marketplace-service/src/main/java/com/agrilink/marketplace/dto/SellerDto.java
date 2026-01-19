package com.agrilink.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO representing a seller (farmer) with aggregate product data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDto {

    private UUID id;
    private String name;
    private String farmName;
    private String location;
    private String avatar;
    private String coverImage;
    private Double rating;
    private Integer reviewCount;
    private Integer followers;
    private Integer products;
    private Boolean verified;
    private String[] specialties;
    private Integer joinedYear;
    private String description;
}
