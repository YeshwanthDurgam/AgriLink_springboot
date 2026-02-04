package com.agrilink.user.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating/updating customer profile.
 * All fields are optional - validation only applies when field is provided.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileRequest {
    
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    @Size(max = 50, message = "Username must be less than 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]*$", message = "Username can only contain letters, numbers, and underscores")
    private String username;
    
    @Size(max = 20, message = "Phone must be less than 20 characters")
    private String phone;
    
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be less than 120")
    private Integer age;
    
    // Allow large base64 images (up to ~5MB)
    @Size(max = 10000000, message = "Profile photo is too large")
    private String profilePhoto;
    
    @Size(max = 100, message = "City must be less than 100 characters")
    private String city;
    
    @Size(max = 100, message = "State must be less than 100 characters")
    private String state;
    
    @Size(max = 100, message = "Country must be less than 100 characters")
    private String country;

    @Size(max = 500, message = "Address must be less than 500 characters")
    private String address;

    @Size(max = 10, message = "Pincode must be less than 10 characters")
    @Pattern(regexp = "^[0-9]*$", message = "Pincode can only contain numbers")
    private String pincode;
}
