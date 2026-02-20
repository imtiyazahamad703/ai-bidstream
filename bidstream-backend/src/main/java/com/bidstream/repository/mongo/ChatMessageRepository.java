package com.bidstream.repository.mongo;

import com.bidstream.domain.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    // Finds all chat messages for a specific auction, ordered by timestamp
    List<ChatMessage> findByAuctionIdOrderByTimestampAsc(Long auctionId);
}
