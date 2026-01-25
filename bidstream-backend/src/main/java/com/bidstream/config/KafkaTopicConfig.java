package com.bidstream.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String BID_EVENTS_TOPIC = "auction-bid-events";

    @Bean
    public NewTopic bidEventsTopic() {
        return TopicBuilder.name(BID_EVENTS_TOPIC)
                .partitions(1)
                .replicas(1) // Single replica for local dev
                .build();
    }
}
