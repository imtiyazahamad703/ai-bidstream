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
public class GroqChatService {

    @Value("${groq.api.keys:}")
    private List<String> apiKeys;
    
    @Value("${groq.api.chat.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final java.util.concurrent.atomic.AtomicInteger currentKeyIndex = new java.util.concurrent.atomic.AtomicInteger(0);
    private final java.util.concurrent.ConcurrentHashMap<String, Long> penaltyBox = new java.util.concurrent.ConcurrentHashMap<>();

    public GroqChatService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateChatResponse(String prompt) {
        if (apiKeys == null || apiKeys.isEmpty()) {
            throw new RuntimeException("No Groq API keys configured.");
        }

        Map<String, Object> body = Map.of(
            "model", "llama3-8b-8192",
            "messages", List.of(Map.of(
                "role", "user",
                "content", prompt
            ))
        );

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
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(key.trim());
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            try {
                Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);
                if (i > 0) {
                    currentKeyIndex.set(index); // Update to the new working key
                }
                return extractTextFromResponse(response);
            } catch (Exception e) {
                String errorMsg = e.getMessage();
                System.out.println("Failed with Groq API key: " + key + ". Reason: " + errorMsg);
                
                // Add to penalty box. If 403 or 401, punish for a year, else 1 minute
                if (errorMsg != null && (errorMsg.contains("403") || errorMsg.contains("401"))) {
                    penaltyBox.put(key, System.currentTimeMillis() + 31536000000L); 
                } else {
                    penaltyBox.put(key, System.currentTimeMillis());
                }
            }
        }
        
        throw new RuntimeException("All Groq API keys failed or were rate limited.");
    }
    
    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
            return "Sorry, I couldn't understand the response from the AI model.";
        } catch (Exception e) {
            System.err.println("Error parsing Groq response: " + e.getMessage());
            return "Sorry, an error occurred while parsing the AI response.";
        }
    }
}
