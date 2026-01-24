package com.bidstream.service;

import com.bidstream.domain.ChatMessage;
import com.bidstream.repository.mongo.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatHistoryService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatHistoryService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    public void saveMessage(Long auctionId, Long userId, String userEmail, String role, String content) {
        ChatMessage message = new ChatMessage(auctionId, userId, userEmail, role, content);
        chatMessageRepository.save(message);
    }

    public List<ChatMessage> getHistory(Long auctionId, Long userId) {
        return chatMessageRepository.findByAuctionIdAndUserIdOrderByTimestampAsc(auctionId, userId);
    }

    public List<ChatMessage> getAllHistory(Long auctionId) {
        return chatMessageRepository.findByAuctionIdOrderByTimestampAsc(auctionId);
    }
}
