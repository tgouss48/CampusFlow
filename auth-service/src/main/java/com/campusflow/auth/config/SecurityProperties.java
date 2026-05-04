package com.campusflow.auth.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private final Jwt jwt = new Jwt();
    private final RefreshCookie refreshCookie = new RefreshCookie();
    private final Verification verification = new Verification();
    private final PasswordReset passwordReset = new PasswordReset();
    private final Mail mail = new Mail();
    private final RateLimiting rateLimiting = new RateLimiting();
    private final Kafka kafka = new Kafka();
    private final Scheduling scheduling = new Scheduling();
    private List<String> allowedOrigins = new ArrayList<>();

    @Getter
    @Setter
    public static class Jwt {

        @NotBlank
        private String secret;

        private Duration accessTokenExpiration;

        private Duration refreshTokenExpiration;
    }

    @Getter
    @Setter
    public static class RefreshCookie {

        private String name;

        private boolean secure;

        private String sameSite;

        private String path;
    }

    @Getter
    @Setter
    public static class Verification {

        private Duration tokenExpiration;
    }

    @Getter
    @Setter
    public static class PasswordReset {

        private Duration tokenExpiration;
    }

    @Getter
    @Setter
    public static class Mail {

        private String from;

        private String frontendBaseUrl;
    }

    @Getter
    @Setter
    public static class RateLimiting {
        private int maxRequests;
        private Duration window;
        private long cleanupIntervalMs;
    }

    @Getter
    @Setter
    public static class Kafka {
        private final Topics topics = new Topics();

        @Getter
        @Setter
        public static class Topics {
            private String userProfileUpdates;
        }
    }

    @Getter
    @Setter
    public static class Scheduling {
        private String purgeExpiredTokensCron;
        private String purgeAccountTokensCron;
    }

    public String resolveCsrfCookieDomain() {
        for (String origin : allowedOrigins) {
            if (origin == null || origin.isBlank()) {
                continue;
            }

            try {
                URI uri = new URI(origin);
                String host = uri.getHost();
                if (host != null && !host.isBlank() && !"localhost".equalsIgnoreCase(host)) {
                    return host;
                }
            } catch (URISyntaxException ignored) {
                // Ignore malformed origins and keep looking for a valid host.
            }
        }

        return null;
    }
}
