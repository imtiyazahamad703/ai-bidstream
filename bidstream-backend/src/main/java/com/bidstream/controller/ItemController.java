package com.bidstream.controller;

import com.bidstream.dto.ItemRequestDto;
import com.bidstream.dto.ItemResponseDto;
import com.bidstream.entity.Item;
import com.bidstream.service.ItemService;
import com.bidstream.service.DocExtractionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;
    private final DocExtractionService docExtractionService;

    public ItemController(ItemService itemService, DocExtractionService docExtractionService) {
        this.itemService = itemService;
        this.docExtractionService = docExtractionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> createItem(@Valid @RequestBody ItemRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item item = new Item();
        item.setName(requestDto.getName());
        item.setDescription(requestDto.getDescription());
        item.setStartingPrice(requestDto.getStartingPrice());
        item.setAttributes(requestDto.getAttributes());
        item.setImageData(requestDto.getImageData());
        
        Item createdItem = itemService.createItem(item, sellerEmail);
        return ResponseEntity.ok(mapToDto(createdItem));
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<ItemResponseDto>> getSellerItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Item> items;
        if (search != null && !search.trim().isEmpty()) {
            items = itemService.searchItemsBySellerAndName(search, sellerEmail, pageable);
        } else if (minPrice != null && maxPrice != null) {
            items = itemService.filterItemsByPrice(sellerEmail, minPrice, maxPrice, pageable);
        } else {
            items = itemService.getItemsBySeller(sellerEmail, pageable);
        }
        return ResponseEntity.ok(items.map(this::mapToDto));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> getItemDetails(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        return itemService.getItemById(id)
                .map(item -> {
                    itemService.verifyItemOwnership(item, sellerEmail);
                    return ResponseEntity.ok(mapToDto(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> updateItem(@PathVariable String id, @Valid @RequestBody ItemRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item updatedData = new Item();
        updatedData.setName(requestDto.getName());
        updatedData.setDescription(requestDto.getDescription());
        updatedData.setStartingPrice(requestDto.getStartingPrice());
        updatedData.setAttributes(requestDto.getAttributes());
        updatedData.setImageData(requestDto.getImageData());

        Item updatedItem = itemService.updateItem(id, updatedData, sellerEmail);
        return ResponseEntity.ok(mapToDto(updatedItem));
    }

    @PatchMapping("/{id}/image")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> updateItemImage(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
        itemService.verifyItemOwnership(item, sellerEmail);
        
        item.setImageData(body.get("imageData"));
        Item saved = itemService.saveItem(item);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        itemService.deleteItem(id, sellerEmail);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload PDF/DOC/DOCX documents for an item.
     * Extracts text and stores it in item's documentTexts for RAG embedding.
     */
    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<?> uploadDocuments(
            @PathVariable String id,
            @RequestParam("files") List<MultipartFile> files) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
        itemService.verifyItemOwnership(item, sellerEmail);

        // Validate files
        long MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
        List<String> allowedTypes = List.of("application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        
        List<String> extractedTexts = item.getDocumentTexts() != null 
                ? new ArrayList<>(item.getDocumentTexts()) 
                : new ArrayList<>();
        List<String> processedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            
            if (file.getSize() > MAX_SIZE) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "File '" + file.getOriginalFilename() + "' exceeds 10MB limit"));
            }
            
            String contentType = file.getContentType();
            String fileName = file.getOriginalFilename();
            if (fileName == null) continue;
            
            String lowerName = fileName.toLowerCase();
            boolean isAllowed = allowedTypes.contains(contentType) 
                    || lowerName.endsWith(".pdf") 
                    || lowerName.endsWith(".doc") 
                    || lowerName.endsWith(".docx");
            
            if (!isAllowed) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "File '" + fileName + "' is not a supported type. Only PDF, DOC, DOCX allowed."));
            }

            try {
                String extractedText = docExtractionService.extractText(file);
                if (extractedText != null && !extractedText.trim().isEmpty()) {
                    // Prefix with filename for source tracking
                    extractedTexts.add("[Source: " + fileName + "]\n" + extractedText.trim());
                    processedFiles.add(fileName);
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process file '" + fileName + "': " + e.getMessage()));
            }
        }

        // Save extracted texts to item
        item.setDocumentTexts(extractedTexts);
        itemService.saveItem(item);

        return ResponseEntity.ok(Map.of(
            "message", "Documents processed successfully",
            "processedFiles", processedFiles,
            "totalDocuments", extractedTexts.size()
        ));
    }

    private ItemResponseDto mapToDto(Item item) {
        ItemResponseDto dto = new ItemResponseDto();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setStartingPrice(item.getStartingPrice());
        dto.setCurrentPrice(item.getStartingPrice());
        dto.setSellerEmail(item.getSellerEmail());
        dto.setAttributes(item.getAttributes());
        dto.setAuctionId(item.getAuctionId());
        dto.setStatus(item.getStatus());
        dto.setImageData(item.getImageData());
        dto.setAuctionReady(item.getStatus() == com.bidstream.entity.ItemStatus.AVAILABLE);
        dto.setCreatedAt(item.getCreatedAt());
        return dto;
    }
}
