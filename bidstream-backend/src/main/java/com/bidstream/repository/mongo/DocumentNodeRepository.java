package com.bidstream.repository.mongo;

import com.bidstream.domain.DocumentNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentNodeRepository extends MongoRepository<DocumentNode, String> {
    
    // Finds all chunks associated with a specific auction
    List<DocumentNode> findByAuctionId(Long auctionId);
    
    // Deletes all chunks associated with a specific auction
    void deleteByAuctionId(Long auctionId);
    
    // Custom query methods for embedding operations can be added here
    <S extends DocumentNode> List<S> saveAll(Iterable<S> entities);
}
