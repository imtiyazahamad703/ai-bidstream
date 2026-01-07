package com.bidstream.controller;

import com.bidstream.dto.AuctionRequestDto;
import com.bidstream.dto.AuctionResponseDto;
import com.bidstream.entity.Auction;
import com.bidstream.service.AuctionService;
import com.bidstream.service.ItemEmbeddingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;
    private final ItemEmbeddingService itemEmbeddingService;
    private final com.bidstream.service.ChatHistoryService chatHistoryService;

    public AuctionController(AuctionService auctionService, 
                             ItemEmbeddingService itemEmbeddingService,
                             com.bidstream.service.ChatHistoryService chatHistoryService) {
        this.auctionService = auctionService;
        this.itemEmbeddingService = itemEmbeddingService;
        this.chatHistoryService = chatHistoryService;
    }

    @GetMapping("/{id}/chat")
    public ResponseEntity<java.util.List<com.bidstream.domain.ChatMessage>> getChatHistory(@PathVariable Long id) {
        return ResponseEntity.ok(chatHistoryService.getHistory(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponseDto> createAuction(@Valid @RequestBody AuctionRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Auction auction = new Auction();
        auction.setItemId(requestDto.getItemId());
        auction.setStartTime(requestDto.getStartTime());
        auction.setEndTime(requestDto.getEndTime());
        
        Auction createdAuction = auctionService.createAuction(auction, sellerEmail);
        return ResponseEntity.ok(mapToDto(createdAuction));
    }

    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> cancelAuction(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        auctionService.cancelAuction(id, sellerEmail);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteAuction(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        auctionService.deleteAuction(id, sellerEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponseDto> getAuctionDetails(@PathVariable Long id) {
        return auctionService.getAuctionById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<AuctionResponseDto>> getSellerAuctions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Auction> auctions = auctionService.getAuctionsBySeller(sellerEmail, pageable);
        return ResponseEntity.ok(auctions.map(this::mapToDto));
    }

    private AuctionResponseDto mapToDto(Auction auction) {
        AuctionResponseDto dto = new AuctionResponseDto();
        dto.setId(auction.getId());
        dto.setItemId(auction.getItemId());
        dto.setSellerEmail(auction.getSellerEmail());
        dto.setStartTime(auction.getStartTime());
        dto.setEndTime(auction.getEndTime());
        dto.setStatus(auction.getStatus());
        dto.setCurrentHighestBid(auction.getCurrentHighestBid());
        dto.setStartingPrice(auction.getCurrentHighestBid()); // starting price exposed via current bid baseline
        dto.setCreatedAt(auction.getCreatedAt());
        // itemName populated lazily from item catalog if needed
        return dto;
    }

    /**
     * Manually trigger item embedding for an existing auction.
     * Useful for auctions created before auto-embed was implemented.
     */
    @PostMapping("/{id}/embed")
    public ResponseEntity<?> embedAuctionItem(@PathVariable Long id) {
        itemEmbeddingService.embedItemForAuction(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Embedding triggered for auction " + id));
    }
}
