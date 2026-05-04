package com.campusflow.evenements.config;

import com.campusflow.evenements.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/evenements")
                        .hasAnyAuthority("ROLE_ADEI", "ADEI")
                        .requestMatchers(HttpMethod.PUT, "/api/evenements/**")
                        .hasAnyAuthority("ROLE_ADEI", "ADEI")
                        .requestMatchers(HttpMethod.DELETE, "/api/evenements/**")
                        .hasAnyAuthority("ROLE_ADEI", "ADEI")
                        .requestMatchers(HttpMethod.GET, "/api/evenements/*/participants")
                        .hasAnyAuthority("ROLE_ADEI", "ADEI")
                        .requestMatchers(HttpMethod.GET, "/api/evenements/notifications")
                        .hasAnyAuthority("ROLE_USER", "USER")
                        .requestMatchers(HttpMethod.GET, "/api/evenements/notifications/stream")
                        .permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/evenements/notifications/*/read")
                        .hasAnyAuthority("ROLE_USER", "USER")
                        .requestMatchers(HttpMethod.POST, "/api/evenements/*/participer")
                        .hasAnyAuthority("ROLE_USER", "USER")
                        .requestMatchers(HttpMethod.GET, "/api/evenements").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
