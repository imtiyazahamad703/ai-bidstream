package com.bidstream.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiChatService {

    @Value("${gemini.api.keys:dummy_key}")
    private List<String> apiKeys;
    @Value("${gemini.api.chat.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final java.util.concurrent.atomic.AtomicInteger currentKeyIndex = new java.util.concurrent.atomic.AtomicInteger(0);
    private final java.util.concurrent.ConcurrentHashMap<String, Long> penaltyBox = new java.util.concurrent.ConcurrentHashMap<>();

    public GeminiChatService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateChatResponse(String prompt) {
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("No API keys configured.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            ))
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
                return extractTextFromResponse(response);
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
        
        throw new RuntimeException("All Gemini API keys failed or were rate limited.");
    }
    
    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "Sorry, I couldn't understand the response from the AI model.";
        } catch (Exception e) {
            System.err.println("Error parsing Gemini response: " + e.getMessage());
            return "Sorry, an error occurred while parsing the AI response.";
        }
    }
}
