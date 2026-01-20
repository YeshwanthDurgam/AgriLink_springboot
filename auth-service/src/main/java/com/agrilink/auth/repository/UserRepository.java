package com.agrilink.auth.repository;

import com.agrilink.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhone(String phone);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhone(String phone);

    /**
     * Find all users with a specific role who are enabled.
     * This matches the same criteria used for login.
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    List<User> findByRoleNameAndEnabled(@Param("roleName") String roleName);

    /**
     * Find all user IDs with a specific role who are enabled.
     */
    @Query("SELECT u.id FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    List<UUID> findIdsByRoleNameAndEnabled(@Param("roleName") String roleName);
}
