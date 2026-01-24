package com.bidstream.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "ai_conversations")
public class ChatMessage {

    @Id
    private String id;

    private Long auctionId;
    private Long userId; // The user asking the question
    private String userEmail; // The user's email
    private String role; // "USER" or "ASSISTANT"
    private String content;
    private Instant timestamp;

    public ChatMessage() {
    }

    public ChatMessage(Long auctionId, Long userId, String userEmail, String role, String content) {
        this.auctionId = auctionId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.role = role;
        this.content = content;
        this.timestamp = Instant.now();
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getAuctionId() {
        return auctionId;
    }

    public void setAuctionId(Long auctionId) {
        this.auctionId = auctionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}