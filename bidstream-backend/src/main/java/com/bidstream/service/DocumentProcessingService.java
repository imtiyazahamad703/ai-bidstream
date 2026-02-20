package com.bidstream.service;

import com.bidstream.domain.DocumentNode;
import com.bidstream.repository.mongo.DocumentNodeRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentProcessingService {

    private final PdfExtractionService pdfExtractionService;
    private final TextChunkingService textChunkingService;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final DocumentNodeRepository documentNodeRepository;

    public DocumentProcessingService(PdfExtractionService pdfExtractionService,
                                     TextChunkingService textChunkingService,
                                     GeminiEmbeddingService geminiEmbeddingService,
                                     DocumentNodeRepository documentNodeRepository) {
        this.pdfExtractionService = pdfExtractionService;
        this.textChunkingService = textChunkingService;
        this.geminiEmbeddingService = geminiEmbeddingService;
        this.documentNodeRepository = documentNodeRepository;
    }

    public List<DocumentNode> processDocument(Long auctionId, String filePath, String originalFileName) {
        // 1. Extract Text
        String extractedText = pdfExtractionService.extractTextFromPdf(filePath);

        // 2. Chunk Text
        List<String> chunks = textChunkingService.chunkText(extractedText);

        // 3. Generate Embeddings for each chunk
        List<DocumentNode> documentNodes = new ArrayList<>();
        
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            
            // Generate embedding using the Gemini client
            List<Double> embedding = geminiEmbeddingService.generateEmbedding(chunk);
            if (embedding == null || embedding.isEmpty()) {
                throw new RuntimeException("Generated embedding is empty for chunk " + i);
            }
            
            DocumentNode node = new DocumentNode(auctionId, originalFileName, chunk, embedding);
            
            // Persist additional metadata
            java.util.Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("source", originalFileName);
            metadata.put("chunkIndex", i);
            metadata.put("totalChunks", chunks.size());
            metadata.put("extractedAt", java.time.Instant.now().toString());
            node.setMetadata(metadata);
            
            documentNodes.add(node);
        }

        // 4. Store in MongoDB
        return documentNodeRepository.saveAll(documentNodes);
    }
}
