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
    
    @Size(max = 500, message = "Profile photo URL must be less than 500 characters")
    private String profilePhoto;
    
    @Size(max = 100, message = "City must be less than 100 characters")
    private String city;
    
    @Size(max = 100, message = "State must be less than 100 characters")
    private String state;
    
    @Size(max = 100, message = "Country must be less than 100 characters")
    private String country;
}
