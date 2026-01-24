package com.bidstream.service;

import org.springframework.stereotype.Service;

@Service
public class AuctionAssistantService {

    private final GeminiChatService geminiChatService;
    private final GroqChatService groqChatService;

    public AuctionAssistantService(GeminiChatService geminiChatService, GroqChatService groqChatService) {
        this.geminiChatService = geminiChatService;
        this.groqChatService = groqChatService;
    }

    public String generatePrompt(String userQuestion, String context) {
        return buildAdvancedPrompt(userQuestion, context, null);
    }
    
    public String askAssistant(String userQuestion, String context) {
        String prompt = generatePrompt(userQuestion, context);
        try {
            return geminiChatService.generateChatResponse(prompt);
        } catch (Exception e) {
            System.out.println("Gemini failed, falling back to Groq: " + e.getMessage());
            return groqChatService.generateChatResponse(prompt);
        }
    }
    
    /**
     * Complete RAG Pipeline: Retrieve context, generate prompt, and ask Gemini.
     * Functions as the core chat service logic.
     */
    public String askAuctionAssistant(Long auctionId, String question, VectorSearchService vectorSearchService) {
        // Chat service orchestrates retrieval and response generation
        String context = vectorSearchService.retrieveContext(auctionId, question, 3);
        return askAssistant(question, context);
    }

    /**
     * Complete RAG Pipeline scoped to a specific item within an auction.
     */
    public String askAuctionAssistant(Long auctionId, Long itemId, String question, VectorSearchService vectorSearchService) {
        String context = vectorSearchService.retrieveContext(auctionId, question, 3); // using existing retrieve method, 
        // A more advanced retrieveContext that takes itemId could be implemented in VectorSearchService 
        return askAssistant(question, context);
    }
    
    public String generatePromptWithHistory(String userQuestion, String context, java.util.List<com.bidstream.domain.ChatMessage> history) {
        return buildAdvancedPrompt(userQuestion, context, history);
    }

    private String buildAdvancedPrompt(String userQuestion, String context, java.util.List<com.bidstream.domain.ChatMessage> history) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are the official 'BidStream AI Auctioneer', an expert assistant helping bidders understand the items up for auction.\n\n");
        
        prompt.append("CRITICAL INSTRUCTIONS & GUARDRAILS:\n");
        prompt.append("1. **Strict Context Adherence**: You must base your answers STRICTLY and EXCLUSIVELY on the 'Document Context' provided below. This context is extracted from the seller's verified documents.\n");
        prompt.append("2. **No Hallucinations**: Do not use outside knowledge, guess, or make up information. If the answer is not in the context, you MUST reply with exactly: 'This information is not found in the verified documents provided by the seller.'\n");
        prompt.append("3. **Professional Tone**: Be helpful, concise, and highly professional like a real high-end auctioneer.\n");
        prompt.append("4. **Formatting**: Use Markdown formatting to make your responses easy to read. Use **bold** for key terms or prices, and use bulleted lists where appropriate.\n\n");
        
        prompt.append("=========================\n");
        prompt.append("DOCUMENT CONTEXT:\n").append(context).append("\n");
        prompt.append("=========================\n\n");
        
        if (history != null && !history.isEmpty()) {
            prompt.append("CONVERSATION HISTORY:\n");
            for (com.bidstream.domain.ChatMessage msg : history) {
                prompt.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
            }
            prompt.append("\n");
        }
        
        prompt.append("USER QUESTION: ").append(userQuestion).append("\n");
        return prompt.toString();
    }
    
    /**
     * Integrates document context retrieval into the live RAG pipeline stream.
     */
    public String buildLiveAuctionContext(Long auctionId, String question, VectorSearchService vectorSearchService) {
        return vectorSearchService.retrieveContext(auctionId, question, 3);
    }
    
    /**
     * Clears cached responses for a specific auction if document context changes.
     */
    @org.springframework.cache.annotation.CacheEvict(value = "ai_responses", allEntries = true)
    public void invalidateAuctionCache(Long auctionId) {
        System.out.println("Invalidated RAG cache for auction: " + auctionId);
    }
    
    /**
     * Completes a conversation turn by pulling history, answering, and saving the interaction.
     */
    @org.springframework.cache.annotation.Cacheable(value = "ai_responses", key = "#auctionId + '_' + #userId + '_' + #question")
    public String handleConversationTurn(Long auctionId, Long userId, String userEmail, String question, 
                                         VectorSearchService vectorSearchService, 
                                         ChatHistoryService chatHistoryService) {
        
        // 1. Retrieve history
        java.util.List<com.bidstream.domain.ChatMessage> history = chatHistoryService.getHistory(auctionId, userId);
        
        // 2. Retrieve document context
        String context = vectorSearchService.retrieveContext(auctionId, question, 3);
        
        // 3. Generate prompt and ask AI
        String prompt = generatePromptWithHistory(question, context, history);
        
        // Cache miss indicator log
        System.out.println("Cache miss for auctionId: " + auctionId + ", question: " + question);
        
        String response;
        try {
            response = geminiChatService.generateChatResponse(prompt);
        } catch (Exception e) {
            System.out.println("Gemini failed during conversation turn, falling back to Groq: " + e.getMessage());
            response = groqChatService.generateChatResponse(prompt);
        }
        
        // 4. Save both user message and AI response
        chatHistoryService.saveMessage(auctionId, userId, userEmail, "USER", question);
        chatHistoryService.saveMessage(auctionId, userId, userEmail, "ASSISTANT", response);
        
        return response;
    }
}
