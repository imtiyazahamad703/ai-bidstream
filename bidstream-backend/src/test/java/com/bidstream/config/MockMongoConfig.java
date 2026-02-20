package com.bidstream.config;

import com.bidstream.repository.mongo.ChatMessageRepository;
import com.bidstream.repository.mongo.DocumentNodeRepository;
import com.bidstream.repository.mongo.ItemRepository;
import org.mockito.Mockito;
import org.redisson.api.RedissonClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class MockMongoConfig {

    @Bean
    public ChatMessageRepository chatMessageRepository() {
        return Mockito.mock(ChatMessageRepository.class);
    }
    
    @Bean
    public ItemRepository itemRepository() {
        return Mockito.mock(ItemRepository.class);
    }

    @Bean
    public DocumentNodeRepository documentNodeRepository() {
        return Mockito.mock(DocumentNodeRepository.class);
    }
    
    @Bean
    public MongoTemplate mongoTemplate() {
        return Mockito.mock(MongoTemplate.class);
    }
    
    @Bean
    public RedissonClient redissonClient() {
        RedissonClient mock = Mockito.mock(RedissonClient.class);
        Mockito.when(mock.getConfig()).thenReturn(new org.redisson.config.Config());
        return mock;
    }
}
