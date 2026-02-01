package com.agrilink.user.repository;

import com.agrilink.user.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(UUID userId);

    Optional<Address> findByIdAndUserId(UUID id, UUID userId);

    Optional<Address> findByUserIdAndIsDefaultTrue(UUID userId);

    long countByUserId(UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.userId = :userId AND a.id != :addressId")
    void clearDefaultForUser(@Param("userId") UUID userId, @Param("addressId") UUID addressId);

    @Query("SELECT a FROM Address a WHERE a.userId = :userId AND a.addressType IN ('SHIPPING', 'BOTH', 'HOME', 'WORK', 'OTHER')")
    List<Address> findShippingAddresses(@Param("userId") UUID userId);

    @Query("SELECT a FROM Address a WHERE a.userId = :userId AND a.addressType IN ('BILLING', 'BOTH')")
    List<Address> findBillingAddresses(@Param("userId") UUID userId);
}
