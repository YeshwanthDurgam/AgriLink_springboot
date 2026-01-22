package com.agrilink.auth.config;

import com.agrilink.auth.entity.Role;
import com.agrilink.auth.entity.User;
import com.agrilink.auth.repository.RoleRepository;
import com.agrilink.auth.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

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
    private final EntityManager entityManager;

    // Fixed UUIDs for test users - these must match across all services
    private static final UUID FARMER1_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FARMER2_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID CUSTOMER_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID MANAGER_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID ADMIN_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");

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
            createRoleIfNotExists("MANAGER", "Manager role - can verify farmers and view products");
            createRoleIfNotExists("ADMIN", "Administrator role - full system access");

            log.info("Role initialization completed.");
        };
    }

    @Bean
    @Order(2)
    @Transactional
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

            // Manager
            createUserIfNotExists(
                    MANAGER_ID,
                    "manager@agrilink.com",
                    "Manager@123",
                    Set.of("MANAGER"),
                    "Manager"
            );

            // Admin
            createUserIfNotExists(
                    ADMIN_ID,
                    "admin@agrilink.com",
                    "Admin@123",
                    Set.of("ADMIN"),
                    "Admin"
            );

            log.info("========================================");
            log.info("TEST USER CREDENTIALS:");
            log.info("----------------------------------------");
            log.info("Farmer 1: farmer1@agrilink.com / Farmer@123");
            log.info("Farmer 2: farmer2@agrilink.com / Farmer@123");
            log.info("Customer: customer@agrilink.com / Customer@123");
            log.info("Manager: manager@agrilink.com / Manager@123");
            log.info("Admin: admin@agrilink.com / Admin@123");
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
        try {
            // Check if user exists by email
            if (userRepository.existsByEmail(email)) {
                log.info("User already exists by email: {} ({})", displayName, email);
                return;
            }
            
            // Check if user exists by ID using native query to avoid JPA caching issues
            Long count = (Long) entityManager.createNativeQuery("SELECT COUNT(*) FROM users WHERE id = :id")
                    .setParameter("id", userId)
                    .getSingleResult();
            
            if (count > 0) {
                log.info("User already exists by ID: {} ({})", displayName, email);
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

            // Use native SQL INSERT to bypass JPA entity state issues with fixed UUIDs
            String encodedPassword = passwordEncoder.encode(password);
            
            int inserted = entityManager.createNativeQuery(
                "INSERT INTO users (id, email, password, enabled, account_non_expired, account_non_locked, credentials_non_expired) " +
                "VALUES (:id, :email, :password, :enabled, :accountNonExpired, :accountNonLocked, :credentialsNonExpired) " +
                "ON CONFLICT (id) DO NOTHING")
                .setParameter("id", userId)
                .setParameter("email", email)
                .setParameter("password", encodedPassword)
                .setParameter("enabled", true)
                .setParameter("accountNonExpired", true)
                .setParameter("accountNonLocked", true)
                .setParameter("credentialsNonExpired", true)
                .executeUpdate();
            
            if (inserted > 0) {
                // Add role associations
                for (Role role : roles) {
                    entityManager.createNativeQuery(
                        "INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON CONFLICT DO NOTHING")
                        .setParameter("userId", userId)
                        .setParameter("roleId", role.getId())
                        .executeUpdate();
                }
                log.info("Created user: {} ({}) with roles: {}", displayName, email, roleNames);
            } else {
                log.info("User {} ({}) was not created (may already exist)", displayName, email);
            }
        } catch (Exception e) {
            log.warn("Could not create user {} ({}): {}. User may already exist.", displayName, email, e.getMessage());
        }
    }
}
