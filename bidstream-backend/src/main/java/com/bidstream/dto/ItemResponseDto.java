package com.bidstream.dto;

import com.bidstream.entity.ItemStatus;

import java.time.LocalDateTime;
import java.util.Map;

public class ItemResponseDto {
    private String id;
    private String name;
    private String description;
    private Double startingPrice;
    private Double currentPrice;
    private String sellerEmail;
    private Map<String, Object> attributes;
    private Long auctionId;
    private ItemStatus status;
    private Boolean auctionReady;
    private String imageData;
    private LocalDateTime createdAt;
    private java.util.List<String> documentTexts;
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getStartingPrice() { return startingPrice; }
    public void setStartingPrice(Double startingPrice) { this.startingPrice = startingPrice; }
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }
    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }
    public Map<String, Object> getAttributes() { return attributes; }
    public void setAttributes(Map<String, Object> attributes) { this.attributes = attributes; }
    public Long getAuctionId() { return auctionId; }
    public void setAuctionId(Long auctionId) { this.auctionId = auctionId; }
    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }
    public Boolean getAuctionReady() { return auctionReady; }
    public void setAuctionReady(Boolean auctionReady) { this.auctionReady = auctionReady; }
    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.util.List<String> getDocumentTexts() { return documentTexts; }
    public void setDocumentTexts(java.util.List<String> documentTexts) { this.documentTexts = documentTexts; }
}
