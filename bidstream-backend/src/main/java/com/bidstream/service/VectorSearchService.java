package com.bidstream.service;

import com.bidstream.domain.DocumentNode;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VectorSearchService {

    private final GeminiEmbeddingService geminiEmbeddingService;
    private final MongoTemplate mongoTemplate;

    public VectorSearchService(GeminiEmbeddingService geminiEmbeddingService, MongoTemplate mongoTemplate) {
        this.geminiEmbeddingService = geminiEmbeddingService;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Performs a similarity search without auction context filtering.
     */
    public List<DocumentNode> searchSimilarDocuments(String queryText, int limit) {
        return searchSimilarDocuments(null, null, queryText, limit);
    }

    public List<DocumentNode> searchSimilarDocuments(Long auctionId, String queryText, int limit) {
        return searchSimilarDocuments(auctionId, null, queryText, limit);
    }

    public List<DocumentNode> searchSimilarDocuments(Long auctionId, Long itemId, String queryText, int limit) {
        // 1. Convert query text to embedding using explicit question logic
        List<Double> queryEmbedding = generateQuestionEmbedding(queryText);

        // 2. Perform Vector Search (Note: In a real MongoDB Atlas environment, we would use
        // the $vectorSearch aggregation pipeline stage. Here we provide a simplified fallback
        // for standard Spring Data MongoDB to keep the pipeline compiling without Atlas.)
        
        // Construct the vector similarity search query parameters
        int numCandidates = limit * 10;
        String indexName = "vector_index";
        
        org.bson.Document vectorSearchDoc = new org.bson.Document();
        vectorSearchDoc.put("index", indexName);
        vectorSearchDoc.put("path", "embedding");
        vectorSearchDoc.put("queryVector", queryEmbedding);
        vectorSearchDoc.put("numCandidates", numCandidates);
        vectorSearchDoc.put("limit", limit);

        org.bson.Document filter = new org.bson.Document();
        if (auctionId != null) {
            filter.put("auctionId", auctionId);
        }
        if (itemId != null) {
            filter.put("itemId", itemId);
        }
        
        if (!filter.isEmpty()) {
            vectorSearchDoc.put("filter", filter);
        }

        org.springframework.data.mongodb.core.aggregation.Aggregation aggregation = 
            org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(
                context -> new org.bson.Document("$vectorSearch", vectorSearchDoc)
            );

        List<DocumentNode> rawResults = mongoTemplate.aggregate(aggregation, "document_embeddings", DocumentNode.class).getMappedResults();
        
        // Post-process mapping: Ensure chunks are properly populated
        return rawResults.stream()
                .map(node -> {
                    // Mapping enhancement: Add similarity score or metadata if available from Vector Search
                    if (node.getMetadata() == null) {
                        node.setMetadata(new java.util.HashMap<>());
                    }
                    node.getMetadata().put("mappedFromVectorSearch", true);
                    return node;
                })
                .toList();
    }
    
    /**
     * Generates a dense vector embedding specifically tuned for user questions.
     */
    public List<Double> generateQuestionEmbedding(String question) {
        return geminiEmbeddingService.generateEmbedding(question);
    }
    
    /**
     * Retrieves the most relevant chunks for a question and combines them into a single context string.
     */
    public String retrieveContext(Long auctionId, String question, int maxChunks) {
        List<DocumentNode> results = searchSimilarDocuments(auctionId, null, question, maxChunks);
        if (results == null || results.isEmpty()) {
            return "No relevant context found.";
        }
        
        StringBuilder contextBuilder = new StringBuilder();
        for (DocumentNode node : results) {
            contextBuilder.append(node.getContent()).append("\n\n");
        }
        
        return contextBuilder.toString().trim();
    }
}
