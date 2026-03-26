package com.agrilink.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration for WebClient to call other microservices.
 */
@Configuration
public class WebClientConfig {

    @Value("${user.service.url:http://localhost:8082}")
    private String userServiceUrl;

    @Value("${market.data.datagov.base-url:https://api.data.gov.in/resource}")
    private String marketDataBaseUrl;

    @Value("${notification.service.url:http://localhost:8087}")
    private String notificationServiceUrl;

    @Bean
    public WebClient userServiceWebClient() {
        return WebClient.builder()
                .baseUrl(userServiceUrl)
                .build();
    }

    @Bean
    public WebClient marketDataWebClient() {
        return WebClient.builder()
                .baseUrl(marketDataBaseUrl)
                .build();
    }

    @Bean
    public WebClient notificationServiceWebClient() {
        return WebClient.builder()
                .baseUrl(notificationServiceUrl)
                .build();
    }
}
