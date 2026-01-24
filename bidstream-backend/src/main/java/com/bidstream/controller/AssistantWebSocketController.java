package com.bidstream.controller;

import com.bidstream.service.AuctionAssistantService;
import com.bidstream.service.VectorSearchService;
import com.bidstream.service.ChatHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class AssistantWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(AssistantWebSocketController.class);

    private final AuctionAssistantService auctionAssistantService;
    private final VectorSearchService vectorSearchService;
    private final ChatHistoryService chatHistoryService;
    private final SimpMessagingTemplate messagingTemplate;

    public AssistantWebSocketController(AuctionAssistantService auctionAssistantService,
                                        VectorSearchService vectorSearchService,
                                        ChatHistoryService chatHistoryService,
                                        SimpMessagingTemplate messagingTemplate) {
        this.auctionAssistantService = auctionAssistantService;
        this.vectorSearchService = vectorSearchService;
        this.chatHistoryService = chatHistoryService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/auction/{auctionId}/ask")
    public void handleAuctionQuestion(@DestinationVariable Long auctionId, @Payload Map<String, Object> payload) {
        String question = (String) payload.get("question");
        Long userId = payload.containsKey("userId") ? Long.valueOf(payload.get("userId").toString()) : 1L;
        String userEmail = payload.containsKey("userEmail") ? payload.get("userEmail").toString() : null;

        logger.info("Bot question received for auction {}: '{}'", auctionId, question);

        try {
            // Process question via RAG Pipeline
            String response = auctionAssistantService.handleConversationTurn(auctionId, userId, userEmail, question, vectorSearchService, chatHistoryService);

            logger.info("Bot response generated for auction {}: {} chars", auctionId, response != null ? response.length() : 0);

            // Publish success to user-specific topic
            messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/assistant/" + userId, Map.of(
                    "type", "ASSISTANT_RESPONSE",
                    "question", question,
                    "response", response,
                    "auctionId", auctionId,
                    "status", "SUCCESS"
            ));
            
            // Publish to seller monitoring topic
            messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/assistant/monitor", Map.of(
                    "type", "ASSISTANT_RESPONSE",
                    "userId", userId,
                    "userEmail", userEmail != null ? userEmail : "",
                    "question", question,
                    "response", response,
                    "auctionId", auctionId,
                    "status", "SUCCESS"
            ));
        } catch (Exception e) {
            logger.error("Bot ERROR for auction {}: {}", auctionId, e.getMessage(), e);
            // Publish error to user-specific topic
            messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/assistant/" + userId, Map.of(
                    "type", "ASSISTANT_ERROR",
                    "question", question,
                    "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                    "auctionId", auctionId,
                    "status", "FAILED"
            ));
            
            // Publish error to seller monitoring topic
            messagingTemplate.convertAndSend("/topic/auction/" + auctionId + "/assistant/monitor", Map.of(
                    "type", "ASSISTANT_ERROR",
                    "userId", userId,
                    "userEmail", userEmail != null ? userEmail : "",
                    "question", question,
                    "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                    "auctionId", auctionId,
                    "status", "FAILED"
            ));
        }
    }
}
