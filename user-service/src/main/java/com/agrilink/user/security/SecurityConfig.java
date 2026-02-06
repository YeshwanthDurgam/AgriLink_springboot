package com.agrilink.user.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for user-service.
 * NOTE: @EnableMethodSecurity removed - using URL-based security only to avoid 403 issues
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Public endpoints
                    .requestMatchers("/actuator/**").permitAll()
                    .requestMatchers("/error").permitAll()
                    .requestMatchers("/api/v1/users/public/**").permitAll()
                    .requestMatchers("/api/v1/farmers/*/followers/count").permitAll()
                    .requestMatchers("/api/v1/profiles/farmer/approved").permitAll()
                    .requestMatchers("/api/v1/profiles/farmer/approve-all").permitAll()
                    
                    // FARMER role endpoints - profile management (NO verification check)
                    .requestMatchers(HttpMethod.GET, "/api/v1/profiles/farmer").hasRole("FARMER")
                    .requestMatchers(HttpMethod.PUT, "/api/v1/profiles/farmer").hasRole("FARMER")
                    .requestMatchers(HttpMethod.POST, "/api/v1/profiles/farmer").hasRole("FARMER")
                    .requestMatchers(HttpMethod.GET, "/api/v1/profiles/farmer/status").hasRole("FARMER")
                    
                    // MANAGER/ADMIN endpoints
                    .requestMatchers("/api/v1/profiles/farmer/pending/**").hasAnyRole("MANAGER", "ADMIN")
                    .requestMatchers("/api/v1/profiles/farmer/*/approve").hasAnyRole("MANAGER", "ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/v1/profiles/farmer/*").hasAnyRole("MANAGER", "ADMIN")
                    
                    // Manager profile endpoints
                    .requestMatchers("/api/v1/profiles/manager/**").hasAnyRole("MANAGER", "ADMIN")
                    
                    // All other requests require authentication
                    .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
