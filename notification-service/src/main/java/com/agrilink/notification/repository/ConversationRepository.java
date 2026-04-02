package com.agrilink.notification.repository;

import com.agrilink.notification.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Conversation entity.
 */
@Repository
public interface ConversationRepository extends MongoRepository<Conversation, UUID> {

       Page<Conversation> findByParticipant1IdOrParticipant2Id(UUID participant1Id, UUID participant2Id, Pageable pageable);

       List<Conversation> findByParticipant1IdOrParticipant2Id(UUID participant1Id, UUID participant2Id);

       long countByParticipant1IdOrParticipant2Id(UUID participant1Id, UUID participant2Id);

       Optional<Conversation> findByParticipant1IdAndParticipant2IdAndListingId(UUID participant1Id, UUID participant2Id, UUID listingId);

       Optional<Conversation> findByParticipant1IdAndParticipant2IdAndListingIdIsNull(UUID participant1Id, UUID participant2Id);

       default Page<Conversation> findByParticipant(UUID userId, Pageable pageable) {
              return findByParticipant1IdOrParticipant2Id(userId, userId, pageable);
       }

       default Optional<Conversation> findByParticipantsAndListing(UUID user1, UUID user2, UUID listingId) {
              if (listingId == null) {
                     Optional<Conversation> direct = findByParticipant1IdAndParticipant2IdAndListingIdIsNull(user1, user2);
                     return direct.isPresent() ? direct : findByParticipant1IdAndParticipant2IdAndListingIdIsNull(user2, user1);
              }

              Optional<Conversation> direct = findByParticipant1IdAndParticipant2IdAndListingId(user1, user2, listingId);
              return direct.isPresent() ? direct : findByParticipant1IdAndParticipant2IdAndListingId(user2, user1, listingId);
       }

       default Optional<Conversation> findByParticipants(UUID user1, UUID user2) {
              Optional<Conversation> direct = findByParticipant1IdAndParticipant2IdAndListingIdIsNull(user1, user2);
              return direct.isPresent() ? direct : findByParticipant1IdAndParticipant2IdAndListingIdIsNull(user2, user1);
       }

       default int getTotalUnreadCount(UUID userId) {
              return findByParticipant1IdOrParticipant2Id(userId, userId).stream()
                            .mapToInt(c -> userId.equals(c.getParticipant1Id())
                                          ? (c.getParticipant1UnreadCount() == null ? 0 : c.getParticipant1UnreadCount())
                                          : (c.getParticipant2UnreadCount() == null ? 0 : c.getParticipant2UnreadCount()))
                            .sum();
       }

       default long countByParticipant(UUID userId) {
              return countByParticipant1IdOrParticipant2Id(userId, userId);
       }
}
