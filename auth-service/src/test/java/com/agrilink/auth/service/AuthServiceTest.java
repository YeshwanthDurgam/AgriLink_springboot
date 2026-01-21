package com.agrilink.auth.service;

import com.agrilink.auth.dto.LoginRequest;
import com.agrilink.auth.dto.RegisterRequest;
import com.agrilink.auth.dto.UserDto;
import com.agrilink.auth.entity.Role;
import com.agrilink.auth.entity.User;
import com.agrilink.auth.repository.RoleRepository;
import com.agrilink.auth.repository.UserRepository;
import com.agrilink.auth.security.JwtTokenProvider;
import com.agrilink.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private Role farmerRole;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .email("test@example.com")
                .phone("+1234567890")
                .password("Password123!")
                .roles(Set.of("FARMER"))
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("Password123!")
                .build();

        farmerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("FARMER")
                .description("Farmer role")
                .build();

        user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .phone("+1234567890")
                .password("encodedPassword")
                .enabled(true)
                .roles(Set.of(farmerRole))
                .build();
    }

    @Test
    @DisplayName("Should register user successfully")
    void shouldRegisterUserSuccessfully() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(roleRepository.findByName("FARMER")).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        UserDto result = authService.register(registerRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getRoles()).contains("FARMER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email is already registered");
    }

    @Test
    @DisplayName("Should throw exception when phone already exists")
    void shouldThrowExceptionWhenPhoneExists() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phone number is already registered");
    }

    @Test
    @DisplayName("Should throw exception when role is invalid")
    void shouldThrowExceptionWhenRoleInvalid() {
        // Given
        registerRequest.setRoles(Set.of("INVALID_ROLE"));
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName("INVALID_ROLE")).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid role");
    }

    @Test
    @DisplayName("Should login successfully and return token")
    void shouldLoginSuccessfully() {
        // Given
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(anyString(), anyString(), any(UUID.class))).thenReturn("jwt-token");
        when(jwtTokenProvider.getExpirationTime()).thenReturn(86400000L);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        // When
        var result = authService.login(loginRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("jwt-token");
        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }
}
