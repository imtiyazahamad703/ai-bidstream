package com.bidstream.controller;

import com.bidstream.dto.AuctionResponseDto;
import com.bidstream.entity.Auction;
import com.bidstream.entity.AuctionStatus;
import com.bidstream.service.AuctionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/auctions")
public class PublicAuctionController {

    private final AuctionService auctionService;

    public PublicAuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    /** Returns only ACTIVE auctions */
    @GetMapping("/active")
    public ResponseEntity<Page<AuctionResponseDto>> getActiveAuctions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<Auction> activeAuctions = auctionService.getActiveAuctions(pageable);
        return ResponseEntity.ok(activeAuctions.map(this::mapToDto));
    }

    /** Returns details of a specific auction publicly */
    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponseDto> getPublicAuctionDetails(@PathVariable Long id) {
        return auctionService.getAuctionById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search auctions with optional status filter and pagination.
     * GET /api/public/auctions/search?status=ACTIVE&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<Page<AuctionResponseDto>> searchAuctions(
            @RequestParam(required = false) AuctionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(auctionService.searchAuctions(status, pageable).map(this::mapToDto));
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
        dto.setStartingPrice(auction.getCurrentHighestBid());
        dto.setCreatedAt(auction.getCreatedAt());
        return dto;
    }
}
