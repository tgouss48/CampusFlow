package com.campusflow.sociale.controller;

import com.campusflow.sociale.dto.CreateDirectMessageRequest;
import com.campusflow.sociale.dto.MessageResponse;
import com.campusflow.sociale.security.JwtService;
import com.campusflow.sociale.service.SocialeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SocialeController.class)
@AutoConfigureMockMvc(addFilters = false)
class SocialeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SocialeService socialeService;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void listConversations() throws Exception {
        when(socialeService.listConversations()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/sociale/conversations"))
                .andExpect(status().isOk());
    }

    @Test
    void sendDirectMessage() throws Exception {
        CreateDirectMessageRequest request = new CreateDirectMessageRequest(1L, "User", "Content");
        MessageResponse response = new MessageResponse(1L, 1L, 1L, "Me", "Content", LocalDateTime.now(), true);

        when(socialeService.sendDirectMessage(any())).thenReturn(response);

        mockMvc.perform(post("/api/sociale/direct-messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
