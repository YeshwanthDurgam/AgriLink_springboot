package com.agrilink.marketplace.config;

import com.agrilink.marketplace.entity.Category;
import com.agrilink.marketplace.entity.Listing;
import com.agrilink.marketplace.entity.Listing.ListingStatus;
import com.agrilink.marketplace.entity.ListingImage;
import com.agrilink.marketplace.repository.CategoryRepository;
import com.agrilink.marketplace.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Data initializer for development environment.
 * Seeds categories and comprehensive product listings with images.
 */
@Component
@Profile({"dev", "neon"})
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ListingRepository listingRepository;

    // Fixed UUIDs for farmers (same as seeded in auth-service)
    private static final UUID FARMER1_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FARMER2_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Override
    public void run(String... args) {
        try {
            log.info("Starting marketplace data initialization...");

            // Check if data already exists
            if (categoryRepository.count() > 0) {
                log.info("Categories already exist, skipping initialization");
                return;
            }

            // Create categories
            Category vegetables = createCategory("Vegetables", "Fresh vegetables from local farms");
            Category fruits = createCategory("Fruits", "Fresh fruits and berries");
            Category grains = createCategory("Grains", "Rice, wheat, corn and other grains");
            Category dairy = createCategory("Dairy", "Milk, cheese, and dairy products");
            Category organic = createCategory("Organic", "Certified organic produce");
            Category spices = createCategory("Spices", "Fresh and dried spices");
            Category pulses = createCategory("Pulses", "Lentils, beans, and legumes");

            log.info("Created {} categories", categoryRepository.count());

            // Skip listing creation to avoid timeout issues on Neon
            log.info("Skipping listing creation for neon profile to avoid timeout issues");
        } catch (Exception e) {
            log.error("Error during data initialization: {}. Service will continue without seed data.", e.getMessage());
        }
    }

    // Original run method code for listing creation (commented out for neon profile)
    private void createSampleListings(Category vegetables, Category fruits, Category grains, Category dairy, Category organic, Category spices, Category pulses) {
        // ===== FARMER 1 PRODUCTS (Green Valley Farm) =====
        
        // Vegetables
        createListing(FARMER1_ID, vegetables, "Fresh Organic Tomatoes",
            "Vine-ripened organic tomatoes, grown without pesticides. Perfect for salads, sauces, and cooking. Our tomatoes are picked at peak ripeness for maximum flavor.",
            "Tomato", new BigDecimal("150.00"), new BigDecimal("3.50"), new BigDecimal("2.00"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=800",
                    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"));

        createListing(FARMER1_ID, vegetables, "Crispy Lettuce Mix",
            "Fresh mix of romaine, butterhead, and leaf lettuce. Harvested daily for maximum freshness. Perfect for salads and sandwiches.",
            "Lettuce", new BigDecimal("75.00"), new BigDecimal("4.00"), new BigDecimal("1.00"),
            "Green Valley Farm, California", true, "A+",
            List.of("https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=800"));

        createListing(FARMER1_ID, vegetables, "Fresh Spinach Bundle",
            "Nutrient-rich spinach leaves, freshly picked. Excellent source of iron and vitamins. Great for salads, smoothies, and cooking.",
            "Spinach", new BigDecimal("60.00"), new BigDecimal("5.00"), new BigDecimal("0.50"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800"));

        createListing(FARMER1_ID, vegetables, "Organic Bell Peppers",
            "Colorful mix of red, yellow, and green bell peppers. Sweet and crunchy, perfect for salads, stir-fries, and stuffing.",
            "Bell Pepper", new BigDecimal("80.00"), new BigDecimal("6.00"), new BigDecimal("1.00"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800"));

        createListing(FARMER1_ID, vegetables, "Fresh Broccoli",
            "Farm-fresh broccoli florets, packed with vitamins and fiber. Perfect for steaming, roasting, or adding to stir-fries.",
            "Broccoli", new BigDecimal("45.00"), new BigDecimal("4.50"), new BigDecimal("1.00"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"));

        createListing(FARMER1_ID, vegetables, "Organic Cucumbers",
            "Crisp and refreshing cucumbers, grown organically. Perfect for salads, sandwiches, and pickling.",
            "Cucumber", new BigDecimal("90.00"), new BigDecimal("2.50"), new BigDecimal("2.00"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=800"));

        // Fruits
        createListing(FARMER1_ID, fruits, "Sweet Strawberries",
            "Hand-picked strawberries at peak ripeness. Sweet, juicy, and perfect for desserts, smoothies, or eating fresh.",
            "Strawberry", new BigDecimal("40.00"), new BigDecimal("8.00"), new BigDecimal("0.50"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800",
                    "https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=800"));

        createListing(FARMER1_ID, fruits, "Fresh Blueberries",
            "Plump and sweet blueberries, packed with antioxidants. Perfect for breakfast, baking, or snacking.",
            "Blueberry", new BigDecimal("25.00"), new BigDecimal("12.00"), new BigDecimal("0.25"),
            "Green Valley Farm, California", true, "A+",
            List.of("https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800"));

        createListing(FARMER1_ID, fruits, "Organic Avocados",
            "Creamy Hass avocados, perfectly ripe. Rich in healthy fats and perfect for guacamole, toast, or salads.",
            "Avocado", new BigDecimal("50.00"), new BigDecimal("4.00"), new BigDecimal("3.00"),
            "Green Valley Farm, California", true, "A",
            List.of("https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800"));

        // Dairy
        createListing(FARMER1_ID, dairy, "Farm Fresh Eggs",
            "Free-range eggs from happy hens. Rich golden yolks and superior taste. Sold by the dozen.",
            "Eggs", new BigDecimal("200.00"), new BigDecimal("6.00"), new BigDecimal("1.00"),
            "Green Valley Farm, California", true, "Premium",
            List.of("https://images.unsplash.com/photo-1569288052389-dac9b01c9c05?w=800",
                    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800"));

        createListing(FARMER1_ID, dairy, "Fresh Goat Cheese",
            "Artisanal goat cheese made from our farm's goat milk. Creamy texture with tangy flavor.",
            "Cheese", new BigDecimal("15.00"), new BigDecimal("18.00"), new BigDecimal("0.25"),
            "Green Valley Farm, California", false, "Premium",
            List.of("https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800"));

        // ===== FARMER 2 PRODUCTS (Sunrise Farm) =====
        
        // Grains
        createListing(FARMER2_ID, grains, "Premium Basmati Rice",
            "Long-grain aromatic basmati rice aged for 12 months. Fluffy texture and delicate aroma. Perfect for biryanis and pilafs.",
            "Rice", new BigDecimal("500.00"), new BigDecimal("2.50"), new BigDecimal("5.00"),
            "Sunrise Farm, Texas", false, "Premium",
            List.of("https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=800"));

        createListing(FARMER2_ID, grains, "Organic Wheat Flour",
            "Stone-ground whole wheat flour from organically grown wheat. Perfect for bread, chapatis, and baking.",
            "Wheat", new BigDecimal("300.00"), new BigDecimal("1.80"), new BigDecimal("5.00"),
            "Sunrise Farm, Texas", true, "A",
            List.of("https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800"));

        createListing(FARMER2_ID, grains, "Yellow Corn",
            "Fresh sweet corn, perfect for grilling, boiling, or adding to salads. Naturally sweet and tender.",
            "Corn", new BigDecimal("200.00"), new BigDecimal("1.50"), new BigDecimal("10.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800"));

        createListing(FARMER2_ID, grains, "Organic Oats",
            "Rolled oats from organically grown oat crops. Heart-healthy and perfect for breakfast or baking.",
            "Oats", new BigDecimal("150.00"), new BigDecimal("3.00"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", true, "A",
            List.of("https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=800"));

        // Vegetables
        createListing(FARMER2_ID, vegetables, "Fresh Carrots",
            "Sweet and crunchy carrots, freshly harvested. Great for juicing, cooking, or eating raw as snacks.",
            "Carrot", new BigDecimal("200.00"), new BigDecimal("2.00"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800"));

        createListing(FARMER2_ID, vegetables, "Red Onions",
            "Fresh red onions with a mild, sweet flavor. Perfect for salads, cooking, and grilling.",
            "Onion", new BigDecimal("300.00"), new BigDecimal("1.50"), new BigDecimal("3.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800"));

        createListing(FARMER2_ID, vegetables, "Fresh Potatoes",
            "Versatile potatoes perfect for baking, mashing, frying, or roasting. Farm fresh quality.",
            "Potato", new BigDecimal("400.00"), new BigDecimal("1.20"), new BigDecimal("5.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1518977676601-b53f82ber6e3?w=800"));

        createListing(FARMER2_ID, vegetables, "Green Cabbage",
            "Fresh green cabbage, crisp and nutritious. Great for coleslaw, stir-fries, and soups.",
            "Cabbage", new BigDecimal("120.00"), new BigDecimal("1.80"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800"));

        // Fruits
        createListing(FARMER2_ID, fruits, "Golden Apples",
            "Crisp and sweet golden delicious apples. Locally grown with care, perfect for snacking or baking.",
            "Apple", new BigDecimal("180.00"), new BigDecimal("3.00"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800"));

        createListing(FARMER2_ID, fruits, "Fresh Oranges",
            "Juicy navel oranges, bursting with vitamin C. Perfect for juicing or eating fresh.",
            "Orange", new BigDecimal("150.00"), new BigDecimal("2.50"), new BigDecimal("3.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1547514701-42782101795e?w=800"));

        createListing(FARMER2_ID, fruits, "Ripe Bananas",
            "Sweet and nutritious bananas, perfect ripeness. Great for breakfast, smoothies, or baking.",
            "Banana", new BigDecimal("100.00"), new BigDecimal("1.80"), new BigDecimal("1.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800"));

        createListing(FARMER2_ID, fruits, "Sweet Mangoes",
            "Tropical mangoes with rich, sweet flavor. Perfect for eating fresh, smoothies, or desserts.",
            "Mango", new BigDecimal("60.00"), new BigDecimal("5.00"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A+",
            List.of("https://images.unsplash.com/photo-1553279768-865429fa0078?w=800"));

        // Organic products
        createListing(FARMER2_ID, organic, "Raw Organic Honey",
            "Pure raw honey from local beehives. Unprocessed and unfiltered, retaining all natural nutrients.",
            "Honey", new BigDecimal("30.00"), new BigDecimal("15.00"), new BigDecimal("0.50"),
            "Sunrise Farm, Texas", true, "Premium",
            List.of("https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800"));

        createListing(FARMER2_ID, organic, "Organic Olive Oil",
            "Cold-pressed extra virgin olive oil from organic olives. Rich flavor perfect for cooking and dressing.",
            "Olive Oil", new BigDecimal("25.00"), new BigDecimal("18.00"), new BigDecimal("0.50"),
            "Sunrise Farm, Texas", true, "Premium",
            List.of("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800"));

        // Pulses
        createListing(FARMER2_ID, pulses, "Red Lentils",
            "High-protein red lentils, perfect for soups, stews, and curries. Quick cooking and nutritious.",
            "Lentils", new BigDecimal("200.00"), new BigDecimal("2.80"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1515543904269-c4fef373d04a?w=800"));

        createListing(FARMER2_ID, pulses, "Black Beans",
            "Dried black beans, packed with protein and fiber. Great for Mexican dishes, soups, and salads.",
            "Beans", new BigDecimal("150.00"), new BigDecimal("3.20"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800"));

        createListing(FARMER2_ID, pulses, "Chickpeas",
            "Dried chickpeas, versatile and nutritious. Perfect for hummus, curries, and salads.",
            "Chickpeas", new BigDecimal("180.00"), new BigDecimal("2.50"), new BigDecimal("2.00"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800"));

        // Spices
        createListing(FARMER2_ID, spices, "Fresh Ginger",
            "Aromatic fresh ginger root. Essential for Asian cooking, teas, and natural remedies.",
            "Ginger", new BigDecimal("50.00"), new BigDecimal("8.00"), new BigDecimal("0.25"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800"));

        createListing(FARMER2_ID, spices, "Fresh Garlic",
            "Pungent fresh garlic bulbs. Essential ingredient for countless recipes worldwide.",
            "Garlic", new BigDecimal("80.00"), new BigDecimal("6.00"), new BigDecimal("0.50"),
            "Sunrise Farm, Texas", false, "A",
            List.of("https://images.unsplash.com/photo-1540148426945-6cf22a6b2f85?w=800"));

        createListing(FARMER2_ID, spices, "Fresh Turmeric",
            "Vibrant fresh turmeric root with earthy flavor. Known for its health benefits and culinary uses.",
            "Turmeric", new BigDecimal("40.00"), new BigDecimal("10.00"), new BigDecimal("0.25"),
            "Sunrise Farm, Texas", true, "A",
            List.of("https://images.unsplash.com/photo-1615485291234-9d694218aeb3?w=800"));

        log.info("Created {} listings with images", listingRepository.count());
        log.info("Marketplace data initialization completed successfully!");
    }

    private Category createCategory(String name, String description) {
        Category category = Category.builder()
            .name(name)
            .description(description)
            .active(true)
            .build();
        return categoryRepository.save(category);
    }

    private void createListing(
            UUID sellerId,
            Category category,
            String title,
            String description,
            String cropType,
            BigDecimal quantity,
            BigDecimal pricePerUnit,
            BigDecimal minimumOrder,
            String location,
            boolean organicCertified,
            String qualityGrade,
            List<String> imageUrls
    ) {
        Listing listing = Listing.builder()
            .sellerId(sellerId)
            .category(category)
            .title(title)
            .description(description)
            .cropType(cropType)
            .quantity(quantity)
            .quantityUnit("KG")
            .pricePerUnit(pricePerUnit)
            .currency("INR")
            .minimumOrder(minimumOrder)
            .harvestDate(LocalDate.now().minusDays((int)(Math.random() * 7) + 1))
            .expiryDate(LocalDate.now().plusDays((int)(Math.random() * 14) + 7))
            .location(location)
            .organicCertified(organicCertified)
            .qualityGrade(qualityGrade)
            .status(ListingStatus.ACTIVE)
            .viewCount((int)(Math.random() * 500))
            .averageRating(new BigDecimal(String.format("%.1f", 3.5 + Math.random() * 1.5)))
            .reviewCount((int)(Math.random() * 50))
            .build();

        // Add images
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                ListingImage image = ListingImage.builder()
                    .imageUrl(imageUrls.get(i))
                    .primary(i == 0)
                    .sortOrder(i)
                    .build();
                listing.addImage(image);
            }
        }

        listingRepository.save(listing);
    }
}
