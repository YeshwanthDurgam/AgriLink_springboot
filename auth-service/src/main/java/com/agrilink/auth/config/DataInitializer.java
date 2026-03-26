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
import org.springframework.transaction.support.TransactionTemplate;

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
    private final TransactionTemplate transactionTemplate;

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
    public CommandLineRunner initTestUsers() {
        return args -> {
            // Test users are now created manually via insert-admin.sql script
            // The DataInitializer had issues with Hibernate entity lifecycle management for fixed UUIDs
            // Users can be created via the /api/auth/register endpoint or directly in the database
            
            log.info("========================================");
            log.info("TEST USER CREDENTIALS:");
            log.info("----------------------------------------");
            log.info("Farmer 1: farmer1@agrilink.com / Farmer@123");
            log.info("Farmer 2: farmer2@agrilink.com / Farmer@123");
            log.info("Customer: customer@agrilink.com / Customer@123");
            log.info("Manager: manager@agrilink.com / Manager@123");
            log.info("Admin: admin@agrilink.com / Admin@123");
            log.info("========================================");
            log.info("Note: Create additional test users via the authentication API or database.");
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

            // Create user using direct SQL insert
            String encodedPassword = passwordEncoder.encode(password);
            
            try {
                // Simple INSERT without ON CONFLICT - handle duplicate key exception
                String insertUserSql = "INSERT INTO users (id, email, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, created_at, updated_at) " +
                        "VALUES (?, ?, ?, true, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
                        
                entityManager.createNativeQuery(insertUserSql)
                        .setParameter(1, userId.toString())
                        .setParameter(2, email)
                        .setParameter(3, encodedPassword)
                        .executeUpdate();
                
                // Add role associations
                for (Role role : roles) {
                    String insertRoleSql = "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)";
                    entityManager.createNativeQuery(insertRoleSql)
                            .setParameter(1, userId.toString())
                            .setParameter(2, role.getId().toString())
                            .executeUpdate();
                }
                
                log.info("Created user: {} ({}) with roles: {}", displayName, email, roleNames);
            } catch (Exception sqlException) {
                // User or role assignment may already exist - this is okay
                log.debug("Could not insert user {} (may already exist): {}", email, sqlException.getMessage());
            }
            
        } catch (Exception e) {
            log.warn("Could not create user {} ({}): {}. User may already exist.", displayName, email, e.getMessage());
            log.debug("Full stack trace:", e);
        }
    }
}

