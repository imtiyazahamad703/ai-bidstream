package com.bidstream.controller;

import com.bidstream.dto.ItemRequestDto;
import com.bidstream.dto.ItemResponseDto;
import com.bidstream.entity.Item;
import com.bidstream.service.ItemService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> createItem(@Valid @RequestBody ItemRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item item = new Item();
        item.setName(requestDto.getName());
        item.setDescription(requestDto.getDescription());
        item.setStartingPrice(requestDto.getStartingPrice());
        item.setAttributes(requestDto.getAttributes());
        item.setImageData(requestDto.getImageData());
        
        Item createdItem = itemService.createItem(item, sellerEmail);
        return ResponseEntity.ok(mapToDto(createdItem));
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Page<ItemResponseDto>> getSellerItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Item> items;
        if (search != null && !search.trim().isEmpty()) {
            items = itemService.searchItemsBySellerAndName(search, sellerEmail, pageable);
        } else if (minPrice != null && maxPrice != null) {
            items = itemService.filterItemsByPrice(sellerEmail, minPrice, maxPrice, pageable);
        } else {
            items = itemService.getItemsBySeller(sellerEmail, pageable);
        }
        return ResponseEntity.ok(items.map(this::mapToDto));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> getItemDetails(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        return itemService.getItemById(id)
                .map(item -> {
                    itemService.verifyItemOwnership(item, sellerEmail);
                    return ResponseEntity.ok(mapToDto(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> updateItem(@PathVariable String id, @Valid @RequestBody ItemRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item updatedData = new Item();
        updatedData.setName(requestDto.getName());
        updatedData.setDescription(requestDto.getDescription());
        updatedData.setStartingPrice(requestDto.getStartingPrice());
        updatedData.setAttributes(requestDto.getAttributes());
        updatedData.setImageData(requestDto.getImageData());

        Item updatedItem = itemService.updateItem(id, updatedData, sellerEmail);
        return ResponseEntity.ok(mapToDto(updatedItem));
    }

    @PatchMapping("/{id}/image")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ItemResponseDto> updateItemImage(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
        itemService.verifyItemOwnership(item, sellerEmail);
        
        item.setImageData(body.get("imageData"));
        Item saved = itemService.saveItem(item);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String sellerEmail = authentication.getName();
        
        itemService.deleteItem(id, sellerEmail);
        return ResponseEntity.noContent().build();
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
