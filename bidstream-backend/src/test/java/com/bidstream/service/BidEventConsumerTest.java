package com.bidstream.service;

import com.bidstream.entity.Bid;
import com.bidstream.event.BidEvent;
import com.bidstream.repository.jpa.BidRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BidEventConsumerTest {

    private BidRepository bidRepository;
    private RedisBidCacheService redisBidCacheService;
    private AuctionEventPublisher auctionEventPublisher;
    private BidEventConsumer bidEventConsumer;

    @BeforeEach
    void setUp() {
        bidRepository = mock(BidRepository.class);
        redisBidCacheService = mock(RedisBidCacheService.class);
        auctionEventPublisher = mock(AuctionEventPublisher.class);
        bidEventConsumer = new BidEventConsumer(bidRepository, redisBidCacheService, auctionEventPublisher);
    }

        @Test
    void consumeBidEvent_Success_SavesBidAndUpdateCache() {
        LocalDateTime now = LocalDateTime.now();
        BidEvent event = new BidEvent(1L, "bidder@test.com", 150.0, now, "track-123");

        bidEventConsumer.consumeBidEvent(event);

        ArgumentCaptor<Bid> bidCaptor = ArgumentCaptor.forClass(Bid.class);
        verify(bidRepository).save(bidCaptor.capture());
        
        Bid savedBid = bidCaptor.getValue();
        assertEquals(1L, savedBid.getAuctionId());
        assertEquals("bidder@test.com", savedBid.getBidderEmail());
        assertEquals(150.0, savedBid.getAmount());
        assertEquals(now, savedBid.getCreatedAt());

        verify(redisBidCacheService).updateHighestBid(eq(1L), eq(200.0), anyString());
    }

    @Test
    void consumeBidEvent_Exception_ThrowsAndDoesNotUpdateCacheIfSaveFails() {
        LocalDateTime now = LocalDateTime.now();
        BidEvent event = new BidEvent(1L, "bidder@test.com", 150.0, now, "track-123");

        when(bidRepository.save(any(Bid.class))).thenThrow(new RuntimeException("DB Error"));

        assertThrows(RuntimeException.class, () -> bidEventConsumer.consumeBidEvent(event));

        verify(bidRepository).save(any(Bid.class));
        verify(redisBidCacheService, never()).updateHighestBid(anyLong(), anyDouble(), anyString());
    }
}
