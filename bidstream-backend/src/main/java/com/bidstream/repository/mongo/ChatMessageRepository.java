package com.bidstream.repository.mongo;

import com.bidstream.domain.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    // Finds all chat messages for a specific auction and user, ordered by timestamp
    List<ChatMessage> findByAuctionIdAndUserIdOrderByTimestampAsc(Long auctionId, Long userId);
    
    // Finds all chat messages for a specific auction regardless of user, ordered by timestamp
    List<ChatMessage> findByAuctionIdOrderByTimestampAsc(Long auctionId);
    
    // Deletes all chat messages for a specific auction
    void deleteByAuctionId(Long auctionId);
}
