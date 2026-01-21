package com.agrilink.marketplace.controller;

import com.agrilink.marketplace.dto.CreateListingRequest;
import com.agrilink.marketplace.dto.ListingDto;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.service.ListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ListingController.
 */
@ExtendWith(MockitoExtension.class)
class ListingControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private ListingService listingService;

    @InjectMocks
    private ListingController listingController;

    private CreateListingRequest createRequest;
    private ListingDto listingDto;
    private UUID listingId;
    private UUID sellerId;

    /**
     * Custom request post processor to set userId attribute
     */
    private RequestPostProcessor userIdAttribute(UUID userId) {
        return request -> {
            request.setAttribute("userId", userId.toString());
            return request;
        };
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(listingController).build();
        objectMapper = new ObjectMapper();
        
        listingId = UUID.randomUUID();
        sellerId = UUID.randomUUID();

        createRequest = CreateListingRequest.builder()
                .title("Fresh Tomatoes")
                .description("Organic fresh tomatoes from our farm")
                .cropType("Tomatoes")
                .quantity(new BigDecimal("100.00"))
                .quantityUnit("KG")
                .pricePerUnit(new BigDecimal("2.50"))
                .currency("INR")
                .organicCertified(true)
                .qualityGrade("A")
                .imageUrls(List.of("https://example.com/tomato.jpg"))
                .build();

        listingDto = ListingDto.builder()
                .id(listingId)
                .sellerId(sellerId)
                .title("Fresh Tomatoes")
                .description("Organic fresh tomatoes from our farm")
                .cropType("Tomatoes")
                .quantity(new BigDecimal("100.00"))
                .quantityUnit("KG")
                .pricePerUnit(new BigDecimal("2.50"))
                .currency("INR")
                .organicCertified(true)
                .qualityGrade("A")
                .status(Listing.ListingStatus.DRAFT)
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/listings")
    class CreateListingTests {

        @Test
        @DisplayName("Should create listing successfully")
        void shouldCreateListingSuccessfully() throws Exception {
            when(listingService.createListing(any(UUID.class), any(CreateListingRequest.class)))
                    .thenReturn(listingDto);

            mockMvc.perform(post("/api/v1/listings")
                            .with(userIdAttribute(sellerId))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Fresh Tomatoes"))
                    .andExpect(jsonPath("$.data.status").value("DRAFT"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/{listingId}")
    class GetListingTests {

        @Test
        @DisplayName("Should get listing by ID")
        void shouldGetListingById() throws Exception {
            when(listingService.getListing(listingId, true)).thenReturn(listingDto);

            mockMvc.perform(get("/api/v1/listings/{listingId}", listingId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(listingId.toString()))
                    .andExpect(jsonPath("$.data.title").value("Fresh Tomatoes"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings")
    class GetActiveListingsTests {

        @Test
        @DisplayName("Should get active listings")
        void shouldGetActiveListings() throws Exception {
            listingDto.setStatus(Listing.ListingStatus.ACTIVE);
            Page<ListingDto> page = new PageImpl<>(List.of(listingDto), PageRequest.of(0, 20), 1);
            when(listingService.getActiveListings(any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/listings")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content[0].title").value("Fresh Tomatoes"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/my")
    class GetMyListingsTests {

        @Test
        @DisplayName("Should get my listings")
        void shouldGetMyListings() throws Exception {
            Page<ListingDto> page = new PageImpl<>(List.of(listingDto), PageRequest.of(0, 20), 1);
            when(listingService.getListingsBySeller(any(UUID.class), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/listings/my")
                            .with(userIdAttribute(sellerId)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/listings/{listingId}")
    class UpdateListingTests {

        @Test
        @DisplayName("Should update listing successfully")
        void shouldUpdateListingSuccessfully() throws Exception {
            when(listingService.updateListing(eq(listingId), any(UUID.class), any(CreateListingRequest.class)))
                    .thenReturn(listingDto);

            mockMvc.perform(put("/api/v1/listings/{listingId}", listingId)
                            .with(userIdAttribute(sellerId))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Fresh Tomatoes"));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/listings/{listingId}/publish")
    class PublishListingTests {

        @Test
        @DisplayName("Should publish listing successfully")
        void shouldPublishListingSuccessfully() throws Exception {
            listingDto.setStatus(Listing.ListingStatus.ACTIVE);
            when(listingService.publishListing(eq(listingId), any(UUID.class))).thenReturn(listingDto);

            mockMvc.perform(post("/api/v1/listings/{listingId}/publish", listingId)
                            .with(userIdAttribute(sellerId)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.status").value("ACTIVE"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/listings/{listingId}")
    class DeleteListingTests {

        @Test
        @DisplayName("Should delete listing successfully")
        void shouldDeleteListingSuccessfully() throws Exception {
            doNothing().when(listingService).deleteListing(eq(listingId), any(UUID.class));

            mockMvc.perform(delete("/api/v1/listings/{listingId}", listingId)
                            .with(userIdAttribute(sellerId)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/top")
    class GetTopListingsTests {

        @Test
        @DisplayName("Should get top listings")
        void shouldGetTopListings() throws Exception {
            when(listingService.getTopListings(10)).thenReturn(List.of(listingDto));

            mockMvc.perform(get("/api/v1/listings/top")
                            .param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/recent")
    class GetRecentListingsTests {

        @Test
        @DisplayName("Should get recent listings")
        void shouldGetRecentListings() throws Exception {
            when(listingService.getRecentListings(10)).thenReturn(List.of(listingDto));

            mockMvc.perform(get("/api/v1/listings/recent")
                            .param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/listings/category/{categoryId}")
    class GetListingsByCategoryTests {

        @Test
        @DisplayName("Should get listings by category")
        void shouldGetListingsByCategory() throws Exception {
            UUID categoryId = UUID.randomUUID();
            Page<ListingDto> page = new PageImpl<>(List.of(listingDto), PageRequest.of(0, 20), 1);
            when(listingService.getListingsByCategory(eq(categoryId), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/listings/category/{categoryId}", categoryId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }
    }
}
