package com.bidstream.service;

import com.bidstream.domain.DocumentNode;
import com.bidstream.entity.Auction;
import com.bidstream.entity.Item;
import com.bidstream.repository.jpa.AuctionRepository;
import com.bidstream.repository.mongo.DocumentNodeRepository;
import com.bidstream.repository.mongo.ItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Automatically embeds an item's description into document_embeddings
 * when an auction is created, so the AI Bot has context to answer questions
 * even without a PDF upload.
 */
@Service
public class ItemEmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(ItemEmbeddingService.class);

    private final ItemRepository itemRepository;
    private final AuctionRepository auctionRepository;
    private final TextChunkingService textChunkingService;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final DocumentNodeRepository documentNodeRepository;

    public ItemEmbeddingService(ItemRepository itemRepository,
                                AuctionRepository auctionRepository,
                                TextChunkingService textChunkingService,
                                GeminiEmbeddingService geminiEmbeddingService,
                                DocumentNodeRepository documentNodeRepository) {
        this.itemRepository = itemRepository;
        this.auctionRepository = auctionRepository;
        this.textChunkingService = textChunkingService;
        this.geminiEmbeddingService = geminiEmbeddingService;
        this.documentNodeRepository = documentNodeRepository;
    }

    /**
     * Embeds an item's description for the given auction.
     * Called automatically when an auction is created or started.
     */
    public void embedItemForAuction(Long auctionId) {
        try {
            // Check if embeddings already exist for this auction
            List<DocumentNode> existing = documentNodeRepository.findByAuctionId(auctionId);
            if (!existing.isEmpty()) {
                logger.info("Embeddings already exist for auction {}. Skipping auto-embed.", auctionId);
                return;
            }

            // Get the auction to find the itemId
            Auction auction = auctionRepository.findById(auctionId).orElse(null);
            if (auction == null || auction.getItemId() == null) {
                logger.warn("Auction {} not found or has no itemId. Cannot auto-embed.", auctionId);
                return;
            }

            // Get the item from MongoDB
            Item item = itemRepository.findById(auction.getItemId()).orElse(null);
            if (item == null) {
                logger.warn("Item {} not found in MongoDB for auction {}.", auction.getItemId(), auctionId);
                return;
            }

            // Build the full text from item fields
            StringBuilder fullText = new StringBuilder();
            if (item.getName() != null) {
                fullText.append("Item Name: ").append(item.getName()).append("\n\n");
            }
            if (item.getDescription() != null) {
                fullText.append(item.getDescription()).append("\n\n");
            }
            if (item.getStartingPrice() != null) {
                fullText.append("Starting Price: $").append(item.getStartingPrice()).append("\n");
            }
            if (item.getAttributes() != null && !item.getAttributes().isEmpty()) {
                fullText.append("Attributes: ").append(item.getAttributes().toString()).append("\n");
            }
            
            // Include text from uploaded PDF/DOC documents
            if (item.getDocumentTexts() != null && !item.getDocumentTexts().isEmpty()) {
                fullText.append("\n--- Uploaded Documents ---\n\n");
                for (String docText : item.getDocumentTexts()) {
                    fullText.append(docText).append("\n\n");
                }
            }

            String text = fullText.toString().trim();
            if (text.isEmpty()) {
                logger.warn("Item {} has no text content to embed.", auction.getItemId());
                return;
            }

            logger.info("Auto-embedding item '{}' for auction {} ({} chars)", item.getName(), auctionId, text.length());

            // Chunk the text
            List<String> chunks = textChunkingService.chunkText(text);
            List<DocumentNode> nodes = new ArrayList<>();

            for (int i = 0; i < chunks.size(); i++) {
                String chunk = chunks.get(i);
                List<Double> embedding = geminiEmbeddingService.generateEmbedding(chunk);

                if (embedding == null || embedding.isEmpty()) {
                    logger.warn("Empty embedding for chunk {} of item {}. Using mock.", i, auction.getItemId());
                    continue;
                }

                DocumentNode node = new DocumentNode(auctionId, "item-description", chunk, embedding);

                Map<String, Object> metadata = new HashMap<>();
                metadata.put("source", "auto-embedded-item-description");
                metadata.put("itemId", auction.getItemId());
                metadata.put("itemName", item.getName());
                metadata.put("chunkIndex", i);
                metadata.put("totalChunks", chunks.size());
                metadata.put("extractedAt", Instant.now().toString());
                node.setMetadata(metadata);

                nodes.add(node);
            }

            if (!nodes.isEmpty()) {
                documentNodeRepository.saveAll(nodes);
                logger.info("Successfully auto-embedded {} chunks for auction {} (item: {})", nodes.size(), auctionId, item.getName());
            }

        } catch (Exception e) {
            logger.error("Failed to auto-embed item for auction {}: {}", auctionId, e.getMessage(), e);
        }
    }
}
