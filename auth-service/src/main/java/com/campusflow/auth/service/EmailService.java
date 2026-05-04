package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final MailProperties mailProperties;
    private final SecurityProperties securityProperties;

    public void sendEmailVerification(String recipient, String token) {
        String verificationUrl = securityProperties.getMail().getFrontendBaseUrl() + "/verify-email?token=" + token;
        sendOrLog(
                recipient,
                "Vérifiez votre adresse email CampusFlow",
                """
                        Bienvenue sur CampusFlow.

                        Vérifiez votre adresse email en ouvrant ce lien:
                        %s
                        """.formatted(verificationUrl)
        );
    }

    public void sendPasswordReset(String recipient, String token) {
        String resetUrl = securityProperties.getMail().getFrontendBaseUrl() + "/reset-password?token=" + token;
        sendOrLog(
                recipient,
                "Réinitialisation de votre mot de passe CampusFlow",
                """
                        Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte CampusFlow.

                        Réinitialisez votre mot de passe en ouvrant ce lien:
                        %s
                        """.formatted(resetUrl)
        );
    }

    private void sendOrLog(String recipient, String subject, String text) {
        if (!StringUtils.hasText(mailProperties.getHost())
                || !StringUtils.hasText(mailProperties.getUsername())
                || !StringUtils.hasText(mailProperties.getPassword())) {
            log.warn("SMTP not fully configured. Recipient: {}, subject: {}", recipient, subject);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mail sender not available. Recipient: {}, subject: {}", recipient, subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(securityProperties.getMail().getFrom());
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
}
