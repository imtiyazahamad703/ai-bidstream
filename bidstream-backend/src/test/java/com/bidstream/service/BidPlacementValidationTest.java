package com.bidstream.service;

import com.bidstream.entity.Auction;
import com.bidstream.entity.AuctionStatus;
import com.bidstream.entity.Bid;
import com.bidstream.repository.jpa.BidRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class BidPlacementValidationTest {

    private BidRepository bidRepository;
    private AuctionService auctionService;
    private AuctionParticipationService participationService;
    private HighestBidService highestBidService;
    private RedisBidCacheService redisBidCacheService;
    private AuctionLockService lockService;
    private BidEventProducer bidEventProducer;
    private BidService bidService;

    @BeforeEach
    void setUp() {
        bidRepository = Mockito.mock(BidRepository.class);
        auctionService = Mockito.mock(AuctionService.class);
        participationService = Mockito.mock(AuctionParticipationService.class);
        highestBidService = Mockito.mock(HighestBidService.class);
        redisBidCacheService = Mockito.mock(RedisBidCacheService.class);
        lockService = Mockito.mock(AuctionLockService.class);
        bidEventProducer = Mockito.mock(BidEventProducer.class);
        
        when(lockService.tryLock(anyLong())).thenReturn(true);
        
        bidService = new BidService(bidRepository, auctionService, participationService, highestBidService, redisBidCacheService, lockService, bidEventProducer);
    }

    private Auction createAuction(Long id) {
        Auction auction = new Auction();
        auction.setId(id);
        auction.setSellerEmail("seller@test.com");
        auction.setStatus(AuctionStatus.ACTIVE);
        auction.setCurrentHighestBid(100.0);
        return auction;
    }

    @Test
    void placeBid_ValidBid_ShouldSucceed() {
        Auction auction = createAuction(1L);
        when(auctionService.getAuctionById(1L)).thenReturn(Optional.of(auction));
        when(highestBidService.getCurrentHighestBid(1L)).thenReturn(Optional.of(100.0));
        
        Bid savedBid = new Bid();
        savedBid.setAmount(150.0);
        when(bidRepository.save(any(Bid.class))).thenReturn(savedBid);

        Bid result = bidService.placeBid(1L, "bidder@test.com", 150.0);
        
        assertNotNull(result);
        verify(auctionService, never()).updateAuction(auction);
        verify(bidEventProducer).publishBidEvent(any());
        verify(redisBidCacheService).updateHighestBid(1L, 150.0, "bidder@test.com");
    }

        @Test
    void placeBid_AmountTooLow_ShouldThrow() {
        Auction auction = createAuction(1L);
        when(auctionService.getAuctionById(1L)).thenReturn(Optional.of(auction));
        when(highestBidService.getCurrentHighestBid(1L)).thenReturn(Optional.of(100.0));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, 
            () -> bidService.placeBid(1L, "bidder@test.com", 100.0)); // Equal to current highest

        assertTrue(ex.getMessage().contains("High bid volume"));
        verify(bidEventProducer, never()).publishBidEvent(any());
        verify(lockService, never()).unlock(anyLong()); 
    }

    @Test
    void placeBid_AuctionNotFound_ShouldThrow() {
        when(auctionService.getAuctionById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, 
            () -> bidService.placeBid(1L, "bidder@test.com", 150.0));
    }

    @Test
    void placeBid_ParticipationValidationFails_ShouldThrow() {
        Auction auction = createAuction(1L);
        when(auctionService.getAuctionById(1L)).thenReturn(Optional.of(auction));
        
        doThrow(new AccessDeniedException("Not allowed"))
            .when(participationService).validateParticipation(1L, "seller@test.com");

        assertThrows(AccessDeniedException.class, 
            () -> bidService.placeBid(1L, "seller@test.com", 150.0));
    }
}
