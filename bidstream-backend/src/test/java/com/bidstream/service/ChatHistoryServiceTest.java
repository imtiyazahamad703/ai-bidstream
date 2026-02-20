package com.bidstream.service;

import com.bidstream.domain.ChatMessage;
import com.bidstream.repository.mongo.ChatMessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class ChatHistoryServiceTest {

    @Autowired
    private ChatHistoryService chatHistoryService;

    @MockBean
    private ChatMessageRepository chatMessageRepository;

    @Test
    void saveMessage_SavesToRepository() {
        chatHistoryService.saveMessage(1L, 100L, "USER", "Hello");
        verify(chatMessageRepository).save(any(ChatMessage.class));
    }

    @Test
    void getHistory_ReturnsMessages() {
        ChatMessage msg = new ChatMessage(1L, 100L, "USER", "Hello");
        when(chatMessageRepository.findByAuctionIdOrderByTimestampAsc(1L)).thenReturn(List.of(msg));

        List<ChatMessage> history = chatHistoryService.getHistory(1L);
        assertEquals(1, history.size());
        assertEquals("Hello", history.get(0).getContent());
    }
}
