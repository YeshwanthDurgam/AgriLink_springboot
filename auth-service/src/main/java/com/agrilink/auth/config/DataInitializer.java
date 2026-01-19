package com.agrilink.auth.config;

import com.agrilink.auth.entity.Role;
import com.agrilink.auth.entity.User;
import com.agrilink.auth.repository.RoleRepository;
import com.agrilink.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Data initializer that seeds default roles and test users on application startup.
 * Users are only created if they don't already exist.
 * 
 * Fixed UUIDs for test users (must match across services):
 * - farmer1: 11111111-1111-1111-1111-111111111111
 * - farmer2: 22222222-2222-2222-2222-222222222222
 * - customer: 33333333-3333-3333-3333-333333333333
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // Fixed UUIDs for test users - these must match across all services
    private static final UUID FARMER1_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FARMER2_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID CUSTOMER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Bean
    @Order(1)
    public CommandLineRunner initRoles() {
        return args -> {
            log.info("========================================");
            log.info("Initializing default roles...");
            log.info("========================================");

            createRoleIfNotExists("FARMER", "Farmer role - can manage farms and create listings");
            createRoleIfNotExists("CUSTOMER", "Customer role - can browse and purchase products");
            createRoleIfNotExists("BUYER", "Buyer role - can browse and purchase products");
            createRoleIfNotExists("ADMIN", "Administrator role - full system access");

            log.info("Role initialization completed.");
        };
    }

    @Bean
    @Order(2)
    public CommandLineRunner initTestUsers() {
        return args -> {
            log.info("========================================");
            log.info("Initializing test users...");
            log.info("========================================");

            // Farmer 1
            createUserIfNotExists(
                    FARMER1_ID,
                    "farmer1@agrilink.com",
                    "Farmer@123",
                    Set.of("FARMER"),
                    "Farmer 1"
            );

            // Farmer 2
            createUserIfNotExists(
                    FARMER2_ID,
                    "farmer2@agrilink.com",
                    "Farmer@123",
                    Set.of("FARMER"),
                    "Farmer 2"
            );

            // Customer
            createUserIfNotExists(
                    CUSTOMER_ID,
                    "customer@agrilink.com",
                    "Customer@123",
                    Set.of("CUSTOMER"),
                    "Customer"
            );

            log.info("========================================");
            log.info("TEST USER CREDENTIALS:");
            log.info("----------------------------------------");
            log.info("Farmer 1: farmer1@agrilink.com / Farmer@123");
            log.info("Farmer 2: farmer2@agrilink.com / Farmer@123");
            log.info("Customer: customer@agrilink.com / Customer@123");
            log.info("========================================");
            log.info("Test user initialization completed.");
        };
    }

    private void createRoleIfNotExists(String name, String description) {
        if (!roleRepository.existsByName(name)) {
            Role role = Role.builder()
                    .name(name)
                    .description(description)
                    .build();
            roleRepository.save(role);
            log.info("Created role: {}", name);
        } else {
            log.info("Role already exists: {}", name);
        }
    }

    private void createUserIfNotExists(UUID userId, String email, String password, Set<String> roleNames, String displayName) {
        if (userRepository.existsByEmail(email)) {
            log.info("User already exists: {} ({})", displayName, email);
            return;
        }

        // Get roles
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isPresent()) {
                roles.add(roleOpt.get());
            } else {
                log.warn("Role not found: {}. Skipping role assignment for user: {}", roleName, email);
            }
        }

        if (roles.isEmpty()) {
            log.error("No valid roles found for user: {}. Skipping user creation.", email);
            return;
        }

        // Create user with BCrypt-hashed password and fixed UUID
        User user = User.builder()
                .id(userId)
                .email(email)
                .password(passwordEncoder.encode(password))
                .roles(roles)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        userRepository.save(user);
        log.info("Created user: {} ({}) with roles: {}", displayName, email, roleNames);
    }
}
