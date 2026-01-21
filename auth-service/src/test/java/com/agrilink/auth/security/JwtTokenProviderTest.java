package com.agrilink.auth.security;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for JwtTokenProvider.
 */
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private static final String SECRET = "mySecretKeyForJwtTokenGenerationThatIsLongEnough123456789";
    private static final long EXPIRATION_MS = 3600000L; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpiration", EXPIRATION_MS);
    }

    @Nested
    @DisplayName("Token Generation")
    class TokenGenerationTests {

        @Test
        @DisplayName("Should generate valid token")
        void shouldGenerateValidToken() {
            String email = "test@example.com";
            String roles = "ROLE_FARMER";
            UUID userId = UUID.randomUUID();

            String token = jwtTokenProvider.generateToken(email, roles, userId);

            assertThat(token).isNotNull();
            assertThat(token).isNotEmpty();
            assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        }

        @Test
        @DisplayName("Should extract email from token")
        void shouldExtractEmailFromToken() {
            String email = "test@example.com";
            String roles = "ROLE_FARMER";
            UUID userId = UUID.randomUUID();

            String token = jwtTokenProvider.generateToken(email, roles, userId);
            String extractedEmail = jwtTokenProvider.getEmailFromToken(token);

            assertThat(extractedEmail).isEqualTo(email);
        }

        @Test
        @DisplayName("Should extract roles from token")
        void shouldExtractRolesFromToken() {
            String email = "test@example.com";
            String roles = "ROLE_FARMER,ROLE_ADMIN";
            UUID userId = UUID.randomUUID();

            String token = jwtTokenProvider.generateToken(email, roles, userId);
            String extractedRoles = jwtTokenProvider.getRolesFromToken(token);

            assertThat(extractedRoles).isEqualTo(roles);
        }

        @Test
        @DisplayName("Should extract user ID from token")
        void shouldExtractUserIdFromToken() {
            String email = "test@example.com";
            String roles = "ROLE_FARMER";
            UUID userId = UUID.randomUUID();

            String token = jwtTokenProvider.generateToken(email, roles, userId);
            String extractedUserId = jwtTokenProvider.getUserIdFromToken(token);

            assertThat(extractedUserId).isEqualTo(userId.toString());
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidationTests {

        @Test
        @DisplayName("Should validate valid token")
        void shouldValidateValidToken() {
            String token = jwtTokenProvider.generateToken("test@example.com", "ROLE_FARMER", UUID.randomUUID());

            boolean isValid = jwtTokenProvider.validateToken(token);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should reject invalid token")
        void shouldRejectInvalidToken() {
            boolean isValid = jwtTokenProvider.validateToken("invalid.token.here");

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject null token")
        void shouldRejectNullToken() {
            boolean isValid = jwtTokenProvider.validateToken(null);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject empty token")
        void shouldRejectEmptyToken() {
            boolean isValid = jwtTokenProvider.validateToken("");

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject malformed token")
        void shouldRejectMalformedToken() {
            boolean isValid = jwtTokenProvider.validateToken("not-a-jwt-token");

            assertThat(isValid).isFalse();
        }
    }

    @Nested
    @DisplayName("Expiration Time")
    class ExpirationTimeTests {

        @Test
        @DisplayName("Should return correct expiration time")
        void shouldReturnCorrectExpirationTime() {
            long expirationTime = jwtTokenProvider.getExpirationTime();

            assertThat(expirationTime).isEqualTo(EXPIRATION_MS);
        }

        @Test
        @DisplayName("Should reject expired token")
        void shouldRejectExpiredToken() {
            // Create a token provider with very short expiration
            JwtTokenProvider shortExpProvider = new JwtTokenProvider();
            ReflectionTestUtils.setField(shortExpProvider, "jwtSecret", SECRET);
            ReflectionTestUtils.setField(shortExpProvider, "jwtExpiration", 1L); // 1ms expiration

            String token = shortExpProvider.generateToken("test@example.com", "ROLE_FARMER", UUID.randomUUID());
            
            // Wait for token to expire
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            boolean isValid = shortExpProvider.validateToken(token);
            assertThat(isValid).isFalse();
        }
    }
}
