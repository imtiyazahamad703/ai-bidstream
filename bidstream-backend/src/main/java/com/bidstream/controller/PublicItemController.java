package com.bidstream.controller;

import com.bidstream.dto.ItemResponseDto;
import com.bidstream.entity.Item;
import com.bidstream.repository.mongo.ItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/items")
public class PublicItemController {

    private final ItemRepository itemRepository;

    public PublicItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @GetMapping
    public ResponseEntity<Page<ItemResponseDto>> getPublicItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Item> items = itemRepository.findAll(pageable);
        return ResponseEntity.ok(items.map(this::mapToDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponseDto> getPublicItemDetails(@PathVariable String id) {
        return itemRepository.findById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private ItemResponseDto mapToDto(Item item) {
        ItemResponseDto dto = new ItemResponseDto();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setStartingPrice(item.getStartingPrice());
        dto.setCurrentPrice(item.getStartingPrice());
        dto.setSellerEmail(item.getSellerEmail());
        dto.setAttributes(item.getAttributes());
        dto.setAuctionId(item.getAuctionId());
        dto.setStatus(item.getStatus());
        dto.setImageData(item.getImageData());
        dto.setAuctionReady(item.getStatus() == com.bidstream.entity.ItemStatus.AVAILABLE);
        dto.setCreatedAt(item.getCreatedAt());
        return dto;
    }
}
