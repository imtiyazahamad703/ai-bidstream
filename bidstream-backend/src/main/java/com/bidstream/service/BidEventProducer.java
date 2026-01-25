package com.bidstream.service;

import com.bidstream.config.KafkaTopicConfig;
import com.bidstream.event.BidEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class BidEventProducer {

    private static final Logger logger = LoggerFactory.getLogger(BidEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Autowired
    @Lazy
    private BidEventConsumer bidEventConsumer;

    public BidEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishBidEvent(BidEvent bidEvent) {
        // Use auctionId as the partition key to guarantee order per auction
        String key = String.valueOf(bidEvent.getAuctionId());
        
        logger.debug("Publishing BidEvent to topic {}: {}", KafkaTopicConfig.BID_EVENTS_TOPIC, bidEvent);
        try {
            // Set a short timeout for the send operation (blocks only for metadata)
            kafkaTemplate.send(KafkaTopicConfig.BID_EVENTS_TOPIC, key, bidEvent)
                .orTimeout(3, TimeUnit.SECONDS)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        logger.warn("Kafka async send failed for bid {}. Falling back to synchronous processing.", bidEvent.getTrackingId(), ex);
                        processSynchronously(bidEvent);
                    }
                });
        } catch (Exception e) {
            logger.warn("Kafka sync send failed for bid {}. Falling back to synchronous processing.", bidEvent.getTrackingId(), e);
            processSynchronously(bidEvent);
        }
    }
    
    private void processSynchronously(BidEvent bidEvent) {
        try {
            bidEventConsumer.consumeBidEvent(bidEvent);
        } catch (Exception e) {
            logger.error("Fallback synchronous processing also failed for bid {}", bidEvent.getTrackingId(), e);
        }
    }
}
