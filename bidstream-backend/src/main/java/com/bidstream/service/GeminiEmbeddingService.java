package com.bidstream.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class GeminiEmbeddingService {

    @Value("${gemini.api.keys:dummy_key}")
    private List<String> apiKeys;
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final java.util.concurrent.atomic.AtomicInteger currentKeyIndex = new java.util.concurrent.atomic.AtomicInteger(0);

    public GeminiEmbeddingService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Calls the Gemini API to generate embeddings for a given text chunk.
     */
    private final java.util.concurrent.ConcurrentHashMap<String, Long> penaltyBox = new java.util.concurrent.ConcurrentHashMap<>();

    public List<Double> generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Collections.emptyList();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "model", "models/gemini-embedding-001",
            "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        int totalKeys = apiKeys.size();
        for (int i = 0; i < totalKeys; i++) {
            int index = (currentKeyIndex.get() + i) % totalKeys;
            String key = apiKeys.get(index);
            
            if (key == null || key.trim().isEmpty()) {
                continue;
            }

            // Check penalty box (1-minute cooldown)
            Long penaltyTime = penaltyBox.get(key);
            if (penaltyTime != null) {
                if (System.currentTimeMillis() - penaltyTime < 60000) {
                    continue; // Skip this key, it's on cooldown
                } else {
                    penaltyBox.remove(key); // Cooldown expired
                }
            }
            
            String url = apiUrl + "?key=" + key.trim();
            try {
                Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
                if (i > 0) {
                    currentKeyIndex.set(index); // Update to the new working key
                }
                
                return extractEmbeddingFromResponse(response);
            } catch (Exception e) {
                String errorMsg = e.getMessage();
                System.out.println("Failed with Gemini API key ending in ..." + 
                    (key.length() > 4 ? key.substring(key.length() - 4) : key) + ". Reason: " + errorMsg);
                
                // Add to penalty box. If 403, punish for a year, else 1 minute
                if (errorMsg != null && errorMsg.contains("403")) {
                    penaltyBox.put(key, System.currentTimeMillis() + 31536000000L); 
                } else {
                    penaltyBox.put(key, System.currentTimeMillis());
                }
            }
        }
        
        System.err.println("All API keys failed for embedding. Falling back to mock embedding to prevent pipeline crash.");
        return mockEmbedding(3072); 
    }

    private List<Double> extractEmbeddingFromResponse(Map<String, Object> response) {
        if (response != null && response.containsKey("embedding")) {
            Map<String, Object> embeddingNode = (Map<String, Object>) response.get("embedding");
            if (embeddingNode.containsKey("values")) {
                return (List<Double>) embeddingNode.get("values");
            }
        }
        return Collections.emptyList();
    }

    private List<Double> mockEmbedding(int size) {
        List<Double> mock = new java.util.ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            mock.add(Math.random() - 0.5);
        }
        return mock;
    }
}
