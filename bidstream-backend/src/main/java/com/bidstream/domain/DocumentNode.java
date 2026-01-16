package com.bidstream.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Map;

@Document(collection = "document_embeddings")
public class DocumentNode {

    @Id
    private String id;

    private Long auctionId;
    
    // Associates this document directly with the auction item
    private Long itemId;
    
    // Associates this chunk with a parent source document entity
    private String sourceDocumentId;
    
    private String originalFileName;
    
    private String content; // The text chunk
    
    // For MongoDB Vector Search, we store embedding as an array of doubles
    @Field("embedding")
    private List<Double> embedding;
    
    private Map<String, Object> metadata;

    public DocumentNode() {
    }

    public DocumentNode(Long auctionId, String originalFileName, String content, List<Double> embedding) {
        this.auctionId = auctionId;
        this.originalFileName = originalFileName;
        this.content = content;
        this.embedding = embedding;
    }

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

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<Double> getEmbedding() {
        return embedding;
    }

    public void setEmbedding(List<Double> embedding) {
        this.embedding = embedding;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
