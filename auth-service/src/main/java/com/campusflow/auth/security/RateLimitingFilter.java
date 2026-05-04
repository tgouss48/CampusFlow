package com.campusflow.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.campusflow.auth.config.SecurityProperties;
import lombok.RequiredArgsConstructor;

/**
 * Filtre de rate limiting par IP pour protéger les endpoints sensibles
 * (login, register, forgot password, verify-email) contre le brute force.

 * Limites : 10 requêtes par fenêtre de 60 secondes par IP.
 * Les IPs qui dépassent reçoivent un HTTP 429 (Too Many Requests).
 * Un nettoyage automatique des entrées expirées a lieu toutes les 5 minutes.
 */

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (!"POST".equalsIgnoreCase(method)) {
            return true;
        }

        return !path.equals("/api/auth/login")
                && !path.equals("/api/auth/register")
                && !path.equals("/api/auth/password/forgot")
                && !path.equals("/api/auth/password/reset")
                && !path.equals("/api/auth/verify-email/request");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String clientIp = resolveClientIp(request);
        RateBucket bucket = buckets.computeIfAbsent(clientIp,
                ignored -> new RateBucket(securityProperties.getRateLimiting()));

        if (!bucket.tryConsume()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter()
                    .write("{\"error\":\"Trop de tentatives. Veuillez réessayer dans quelques instants.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Nettoie les buckets expirés selon l'intervalle configuré.
     */
    @Scheduled(fixedDelayString = "${app.security.rate-limiting.cleanup-interval-ms}")
    public void cleanup() {
        Instant cutoff = Instant.now().minus(securityProperties.getRateLimiting().getWindow());
        buckets.entrySet().removeIf(entry -> entry.getValue().windowStart.isBefore(cutoff));
    }

    private String resolveClientIp(HttpServletRequest request) {
        // X-Forwarded-For est défini par la Gateway / le reverse proxy
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Compteur thread-safe avec fenêtre glissante.
     * Quand la fenêtre expire, le compteur est automatiquement réinitialisé.
     */
    static final class RateBucket {

        private final SecurityProperties.RateLimiting config;
        private volatile Instant windowStart = Instant.now();
        private final AtomicInteger count = new AtomicInteger(0);

        RateBucket(SecurityProperties.RateLimiting config) {
            this.config = config;
        }

        boolean tryConsume() {
            Instant now = Instant.now();
            if (windowStart.plus(config.getWindow()).isBefore(now)) {
                // Fenêtre expirée — on réinitialise
                synchronized (this) {
                    if (windowStart.plus(config.getWindow()).isBefore(now)) {
                        windowStart = now;
                        count.set(0);
                    }
                }
            }
            return count.incrementAndGet() <= config.getMaxRequests();
        }
    }
}
