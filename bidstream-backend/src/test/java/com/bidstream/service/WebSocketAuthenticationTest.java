package com.bidstream.service;

import com.bidstream.config.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import com.bidstream.config.WebSocketConfig;
import org.springframework.messaging.simp.config.ChannelRegistration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
class WebSocketAuthenticationTest {

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsService userDetailsService;

    @Autowired
    private WebSocketConfig webSocketConfig;

        @Test
    void testWebSocketAuthenticationInterceptor() {
        UserDetails mockUser = User.withUsername("test@test.com")
                .password("password")
                .authorities("USER")
                .build();

        when(jwtUtil.extractUsername("valid-token")).thenReturn("test@test.com");
        when(userDetailsService.loadUserByUsername("test@test.com")).thenReturn(mockUser);
        when(jwtUtil.validateToken("valid-token", mockUser)).thenReturn(true);

        ChannelInterceptor interceptor = webSocketConfig.authInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid-token");

        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> processedMessage = interceptor.preSend(message, null);
        assertNotNull(processedMessage);

        StompHeaderAccessor processedAccessor = StompHeaderAccessor.wrap(processedMessage);
        assertNotNull(processedAccessor.getUser());
    }
}
