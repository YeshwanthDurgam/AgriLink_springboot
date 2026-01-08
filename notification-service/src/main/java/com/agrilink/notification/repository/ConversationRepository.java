package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Conversation entity.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.participant1Id = :userId OR c.participant2Id = :userId ORDER BY c.lastMessageAt DESC NULLS LAST")
    Page<Conversation> findByParticipant(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Conversation c WHERE " +
           "((c.participant1Id = :user1 AND c.participant2Id = :user2) OR " +
           "(c.participant1Id = :user2 AND c.participant2Id = :user1)) AND " +
           "(c.listingId = :listingId OR (:listingId IS NULL AND c.listingId IS NULL))")
    Optional<Conversation> findByParticipantsAndListing(
            @Param("user1") UUID user1, 
            @Param("user2") UUID user2, 
            @Param("listingId") UUID listingId);

    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participant1Id = :user1 AND c.participant2Id = :user2) OR " +
           "(c.participant1Id = :user2 AND c.participant2Id = :user1)")
    Optional<Conversation> findByParticipants(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("SELECT COALESCE(SUM(CASE WHEN c.participant1Id = :userId THEN c.participant1UnreadCount " +
           "ELSE c.participant2UnreadCount END), 0) FROM Conversation c " +
           "WHERE c.participant1Id = :userId OR c.participant2Id = :userId")
    int getTotalUnreadCount(@Param("userId") UUID userId);

    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.participant1Id = :userId OR c.participant2Id = :userId")
    long countByParticipant(@Param("userId") UUID userId);
}
