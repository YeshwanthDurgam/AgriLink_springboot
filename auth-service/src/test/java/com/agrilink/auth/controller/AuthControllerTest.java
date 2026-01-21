package com.agrilink.auth.controller;

import com.agrilink.auth.dto.*;
import com.agrilink.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AuthController.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private UserDto userDto;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
        
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

        userDto = UserDto.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .phone("+1234567890")
                .roles(Set.of("FARMER"))
                .build();

        authResponse = AuthResponse.of(
                "jwt-token-string",
                "test@example.com",
                Set.of("FARMER"),
                3600000L
        );
    }

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class RegisterTests {

        @Test
        @DisplayName("Should register user successfully")
        void shouldRegisterUserSuccessfully() throws Exception {
            when(authService.register(any(RegisterRequest.class))).thenReturn(userDto);

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("test@example.com"));
        }

        @Test
        @DisplayName("Should return 400 when email is invalid")
        void shouldReturnBadRequestWhenEmailInvalid() throws Exception {
            registerRequest.setEmail("invalid-email");

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 when password is blank")
        void shouldReturnBadRequestWhenPasswordBlank() throws Exception {
            registerRequest.setPassword("");

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully")
        void shouldLoginSuccessfully() throws Exception {
            when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.token").value("jwt-token-string"))
                    .andExpect(jsonPath("$.data.email").value("test@example.com"));
        }

        @Test
        @DisplayName("Should return 400 when email is blank")
        void shouldReturnBadRequestWhenEmailBlank() throws Exception {
            loginRequest.setEmail("");

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/auth/me")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should get current user when authenticated")
        void shouldGetCurrentUserWhenAuthenticated() throws Exception {
            when(authService.getCurrentUser()).thenReturn(userDto);

            mockMvc.perform(get("/api/v1/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("test@example.com"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/auth/farmers")
    class GetFarmersTests {

        @Test
        @DisplayName("Should get all farmers")
        void shouldGetAllFarmers() throws Exception {
            when(authService.getFarmers()).thenReturn(List.of(userDto));

            mockMvc.perform(get("/api/v1/auth/farmers"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].email").value("test@example.com"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/auth/farmers/ids")
    class GetFarmerIdsTests {

        @Test
        @DisplayName("Should get all farmer IDs")
        void shouldGetAllFarmerIds() throws Exception {
            UUID farmerId = UUID.randomUUID();
            when(authService.getFarmerIds()).thenReturn(List.of(farmerId));

            mockMvc.perform(get("/api/v1/auth/farmers/ids"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0]").value(farmerId.toString()));
        }
    }
}
