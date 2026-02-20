package com.bidstream.service;

/**
 * Service for managing the seller item catalog workflow.
 * Handles item creation, updates, deletion, and search/filtering.
 * Serves as the foundation for Phase 4 Auction Management.
 */
import com.bidstream.entity.Item;
import com.bidstream.repository.mongo.ItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserService userService;

    public ItemService(ItemRepository itemRepository, UserService userService) {
        this.itemRepository = itemRepository;
        this.userService = userService;
    }

    public Item createItem(Item item, String sellerEmail) {
        userService.getUserByEmail(sellerEmail)
            .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
            
        item.setSellerEmail(sellerEmail);
        return itemRepository.save(item);
    }

    public List<Item> getItemsBySeller(String sellerEmail) {
        return itemRepository.findBySellerEmail(sellerEmail);
    }

    public Page<Item> getItemsBySeller(String sellerEmail, Pageable pageable) {
        return itemRepository.findBySellerEmail(sellerEmail, pageable);
    }

    public Page<Item> searchItemsBySellerAndName(String name, String sellerEmail, Pageable pageable) {
        return itemRepository.findByNameContainingIgnoreCaseAndSellerEmail(name, sellerEmail, pageable);
    }

    public Page<Item> filterItemsByPrice(String sellerEmail, Double minPrice, Double maxPrice, Pageable pageable) {
        return itemRepository.findBySellerEmailAndStartingPriceBetween(sellerEmail, minPrice, maxPrice, pageable);
    }

    public Optional<Item> getItemById(String id) {
        return itemRepository.findById(id);
    }

    public Item updateItem(String id, Item updatedData, String sellerEmail) {
        return itemRepository.findById(id).map(existingItem -> {
            verifyItemOwnership(existingItem, sellerEmail);
            
            if (updatedData.getName() != null) {
                existingItem.setName(updatedData.getName());
            }
            if (updatedData.getDescription() != null) {
                existingItem.setDescription(updatedData.getDescription());
            }
            if (updatedData.getStartingPrice() != null) {
                existingItem.setStartingPrice(updatedData.getStartingPrice());
            }
            if (updatedData.getAttributes() != null) {
                existingItem.setAttributes(updatedData.getAttributes());
            }
            if (updatedData.getImageData() != null) {
                existingItem.setImageData(updatedData.getImageData());
            }
            return itemRepository.save(existingItem);
        }).orElseThrow(() -> new IllegalArgumentException("Item not found"));
    }

    public void deleteItem(String id, String sellerEmail) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Item not found"));
            
        verifyItemOwnership(item, sellerEmail);
        
        if (item.getAuctionId() != null) {
            throw new IllegalStateException("Cannot delete an item that is linked to an auction");
        }
        
        itemRepository.delete(item);
    }
    
    public void verifyItemOwnership(Item item, String sellerEmail) {
        if (!item.getSellerEmail().equals(sellerEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this item");
        }
    }

    public Item saveItem(Item item) {
        return itemRepository.save(item);
    }
}
