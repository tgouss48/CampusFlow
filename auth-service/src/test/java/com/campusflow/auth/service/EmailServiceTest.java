package com.campusflow.auth.service;

import com.campusflow.auth.config.SecurityProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.ObjectProvider;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;
    @Mock
    private MailProperties mailProperties;
    @Mock
    private SecurityProperties securityProperties;
    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        SecurityProperties.Mail mail = new SecurityProperties.Mail();
        mail.setFrontendBaseUrl("http://localhost");
        mail.setFrom("test@test.com");
        when(securityProperties.getMail()).thenReturn(mail);
    }

    @Test
    void sendEmailVerification_SmtpConfigured() {
        when(mailProperties.getHost()).thenReturn("localhost");
        when(mailProperties.getUsername()).thenReturn("user");
        when(mailProperties.getPassword()).thenReturn("pass");
        when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);

        emailService.sendEmailVerification("recipient@test.com", "token");

        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void sendEmailVerification_SmtpNotConfigured() {
        when(mailProperties.getHost()).thenReturn(null);

        emailService.sendEmailVerification("recipient@test.com", "token");

        verify(mailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }
}
