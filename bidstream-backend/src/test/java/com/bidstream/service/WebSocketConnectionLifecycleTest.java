package com.bidstream.service;

import com.bidstream.event.AuctionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

class WebSocketConnectionLifecycleTest {

    private ParticipantTrackerService participantTrackerService;
    private AuctionEventPublisher auctionEventPublisher;
    private WebSocketEventListener webSocketEventListener;

    @BeforeEach
    void setUp() {
        participantTrackerService = new ParticipantTrackerService();
        auctionEventPublisher = Mockito.mock(AuctionEventPublisher.class);
        webSocketEventListener = new WebSocketEventListener(participantTrackerService, auctionEventPublisher);
    }

        @Test
    void testSubscribeAndDisconnectLifecycle() {
        // Subscribe
        StompHeaderAccessor subscribeAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subscribeAccessor.setSessionId("session-123");
        subscribeAccessor.setDestination("/topic/auction.1");
        Message<byte[]> subscribeMessage = MessageBuilder.createMessage(new byte[0], subscribeAccessor.getMessageHeaders());
        
        webSocketEventListener.handleWebSocketSubscribeListener(new SessionSubscribeEvent(this, subscribeMessage, null));
        
        assertEquals(1, participantTrackerService.getActiveBidderCount(1L));
        
        ArgumentCaptor<AuctionEvent> eventCaptor = ArgumentCaptor.forClass(AuctionEvent.class);
        verify(auctionEventPublisher).publishEvent(eventCaptor.capture());
        
        AuctionEvent subscribeEvent = eventCaptor.getValue();
        assertEquals(AuctionEvent.EventType.PARTICIPANT_COUNT, subscribeEvent.getType());
        assertEquals(1, subscribeEvent.getPayload().get("activeBidders"));
        
        // Disconnect
        StompHeaderAccessor disconnectAccessor = StompHeaderAccessor.create(StompCommand.DISCONNECT);
        disconnectAccessor.setSessionId("session-123");
        Message<byte[]> disconnectMessage = MessageBuilder.createMessage(new byte[0], disconnectAccessor.getMessageHeaders());
        
        webSocketEventListener.handleWebSocketDisconnectListener(new SessionDisconnectEvent(this, disconnectMessage, "session-123", null));
        
        assertEquals(0, participantTrackerService.getActiveBidderCount(1L));
        
        verify(auctionEventPublisher, times(2)).publishEvent(eventCaptor.capture());
        AuctionEvent disconnectEvent = eventCaptor.getAllValues().get(1);
        assertEquals(AuctionEvent.EventType.PARTICIPANT_COUNT, disconnectEvent.getType());
        assertEquals(0, disconnectEvent.getPayload().get("activeBidders"));
    }
}
