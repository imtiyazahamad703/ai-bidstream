package com.bidstream.repository.jpa;

import com.bidstream.entity.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    
    List<Bid> findByAuctionIdOrderByCreatedAtDesc(Long auctionId);
    
    Page<Bid> findByAuctionId(Long auctionId, Pageable pageable);
    
    Page<Bid> findByBidderEmail(String bidderEmail, Pageable pageable);
    
    Bid findTopByAuctionIdOrderByAmountDesc(Long auctionId);
    
    void deleteByAuctionId(Long auctionId);
}
