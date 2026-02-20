package com.bidstream.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RedisBidCacheServiceTest {

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisBidCacheService redisBidCacheService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = Mockito.mock(StringRedisTemplate.class);
        valueOperations = Mockito.mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        redisBidCacheService = new RedisBidCacheService(redisTemplate);
    }

    @Test
    void getHighestBid_ExistingValue_ReturnsParsedDouble() {
        when(valueOperations.get("auction:1:highestBid")).thenReturn("150.5");

        Optional<Double> result = redisBidCacheService.getHighestBid(1L);

        assertTrue(result.isPresent());
        assertEquals(150.5, result.get());
    }

    @Test
    void getHighestBid_NoValue_ReturnsEmpty() {
        when(valueOperations.get("auction:1:highestBid")).thenReturn(null);

        Optional<Double> result = redisBidCacheService.getHighestBid(1L);

        assertFalse(result.isPresent());
    }

    @Test
    void getHighestBid_InvalidValue_ReturnsEmpty() {
        when(valueOperations.get("auction:1:highestBid")).thenReturn("not_a_number");

        Optional<Double> result = redisBidCacheService.getHighestBid(1L);

        assertFalse(result.isPresent());
    }

        @Test
    void updateHighestBid_SetsValueInRedis() {
        redisBidCacheService.updateHighestBid(1L, 250.0, "bidder@test.com");

        verify(valueOperations).set("auction:1:highestBid", "200.0");
    }

    @Test
    void initializeAuctionState_SetsIfAbsent() {
        redisBidCacheService.initializeAuctionState(1L, 100.0);

        verify(valueOperations).setIfAbsent("auction:1:highestBid", "100.0");
    }

    @Test
    void updateAuctionState_SetsStateInRedis() {
        redisBidCacheService.updateAuctionState(1L, "ACTIVE");

        verify(valueOperations).set("auction:1:state", "ACTIVE");
    }

    @Test
    void getAuctionState_ReturnsStateFromRedis() {
        when(valueOperations.get("auction:1:state")).thenReturn("ACTIVE");

        Optional<String> result = redisBidCacheService.getAuctionState(1L);

        assertTrue(result.isPresent());
        assertEquals("ACTIVE", result.get());
    }
}
