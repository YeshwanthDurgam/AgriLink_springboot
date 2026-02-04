package com.agrilink.auth.service;

import com.agrilink.auth.client.NotificationClient;
import com.agrilink.auth.dto.*;
import com.agrilink.auth.entity.Role;
import com.agrilink.auth.entity.User;
import com.agrilink.auth.repository.RoleRepository;
import com.agrilink.auth.repository.UserRepository;
import com.agrilink.auth.security.JwtTokenProvider;
import com.agrilink.common.exception.BadRequestException;
import com.agrilink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service handling authentication operations: registration, login, token
 * generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationClient notificationClient;

    /**
     * Register a new user with specified roles.
     */
    @Transactional
    public UserDto register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        // Check if phone already exists (if provided)
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number is already registered");
        }

        // Get roles
        Set<Role> roles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            Role role = roleRepository.findByName(roleName.toUpperCase())
                    .orElseThrow(() -> new BadRequestException("Invalid role: " + roleName));
            roles.add(role);
        }

        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        // Send welcome email asynchronously
        String userName = request.getEmail().split("@")[0]; // Use email prefix as name if no name provided
        notificationClient.sendWelcomeEmail(savedUser.getEmail(), userName);

        return mapToUserDto(savedUser);
    }

    /**
     * Authenticate user and generate JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String rolesString = roles.stream().map(r -> "ROLE_" + r).collect(java.util.stream.Collectors.joining(","));
        String token = jwtTokenProvider.generateToken(user.getEmail(), rolesString, user.getId());

        // Generate display name from email prefix
        String displayName = user.getEmail().split("@")[0];
        // Capitalize first letter
        if (displayName != null && !displayName.isEmpty()) {
            displayName = displayName.substring(0, 1).toUpperCase() + displayName.substring(1);
        }

        log.info("User logged in successfully: {} (name: {})", request.getEmail(), displayName);

        return AuthResponse.of(token, user.getId(), user.getEmail(), displayName, roles, false, "PENDING",
                jwtTokenProvider.getExpirationTime());
    }

    /**
     * Get current authenticated user details.
     */
    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return mapToUserDto(user);
    }

    /**
     * Get all farmers (users with FARMER role who are enabled).
     * Uses same criteria as login - if a farmer can log in, they will be returned.
     */
    @Transactional(readOnly = true)
    public java.util.List<UserDto> getFarmers() {
        log.info("Fetching all enabled farmers");
        java.util.List<User> farmers = userRepository.findByRoleNameAndEnabled("FARMER");
        log.info("Found {} farmers", farmers.size());
        return farmers.stream()
                .map(this::mapToUserDto)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get all farmer IDs (users with FARMER role who are enabled).
     */
    @Transactional(readOnly = true)
    public java.util.List<java.util.UUID> getFarmerIds() {
        log.info("Fetching all enabled farmer IDs");
        return userRepository.findIdsByRoleNameAndEnabled("FARMER");
    }

    private UserDto mapToUserDto(User user) {
        // Generate display name from email prefix
        String displayName = user.getEmail().split("@")[0];
        // Capitalize first letter
        if (displayName != null && !displayName.isEmpty()) {
            displayName = displayName.substring(0, 1).toUpperCase() + displayName.substring(1);
        }
        
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(displayName)
                .phone(user.getPhone())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }

}
