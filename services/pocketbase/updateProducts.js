// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// 1. FUNCTION TO UPDATE BASIC PRODUCT INFORMATION
// Updates just the main product record's fields
export async function updateBasicProduct(id, productData) {
  try {
    console.log(`Updating basic product ${id} with data:`, productData);

    // Update the product with the new data
    const updatedProduct = await pb.collection("products").update(id, productData);
    console.log('Product updated successfully:', updatedProduct);

    return {
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    };
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return {
      success: false,
      message: error.message || "Failed to update product",
      error
    };
  }
}

// 2. FUNCTION TO UPDATE A PRODUCT WITH ALL ITS RELATED DATA
// Updates the main product and any provided related data (pricing, specs, stock, warranty)
export async function updateProductWithAllData(id, productData, relatedData = {}) {
  try {
    console.log(`Updating product ${id} with data:`, { productData, relatedData });

    // Keep track of all updates for the result
    const updates = {};

    // 1. Update the main product record
    if (Object.keys(productData).length > 0) {
      const updatedProduct = await pb.collection("products").update(id, productData);
      updates.product = updatedProduct;
      console.log('Main product record updated:', updatedProduct);
    }

    // 2. Update or create related records if provided

    // Handle pricing update
    if (relatedData.pricing) {
      try {
        // First try to find existing pricing record
        const existingPricing = await pb.collection("product_pricing")
          .getFirstListItem(`product_id="${id}"`);
        console.log('Found existing pricing record:', existingPricing);

        // Update existing record
        const updatedPricing = await pb.collection("product_pricing")
          .update(existingPricing.id, relatedData.pricing);
        console.log('Updated pricing record:', updatedPricing);

        updates.pricing = updatedPricing;
      } catch (err) {
        // No pricing record found, create a new one
        console.log('No existing pricing record found, creating new one');
        const pricingData = {
          ...relatedData.pricing,
          product_id: id
        };

        const newPricing = await pb.collection("product_pricing").create(pricingData);
        console.log('Created new pricing record:', newPricing);
        updates.pricing = newPricing;
      }
    }

    // Handle specifications update
    if (relatedData.specifications) {
      try {
        // First try to find existing specifications record
        const existingSpecs = await pb.collection("product_specifications")
          .getFirstListItem(`product_id="${id}"`);

        // Update existing record
        const updatedSpecs = await pb.collection("product_specifications")
          .update(existingSpecs.id, relatedData.specifications);

        updates.specifications = updatedSpecs;
      } catch (err) {
        // No specifications record found, create a new one
        const specsData = {
          ...relatedData.specifications,
          product_id: id
        };

        const newSpecs = await pb.collection("product_specifications").create(specsData);
        updates.specifications = newSpecs;
      }
    }

    // Handle stock update
    if (relatedData.stock) {
      try {
        // First try to find existing stock record
        const existingStock = await pb.collection("product_stocks")
          .getFirstListItem(`product_id="${id}"`);

        // Update existing record
        const updatedStock = await pb.collection("product_stocks")
          .update(existingStock.id, relatedData.stock);

        updates.stock = updatedStock;
      } catch (err) {
        // No stock record found, create a new one
        const stockData = {
          ...relatedData.stock,
          product_id: id
        };

        const newStock = await pb.collection("product_stocks").create(stockData);
        updates.stock = newStock;
      }
    }

    // Handle warranty update
    if (relatedData.warranty) {
      try {
        // First try to find existing warranty record
        const existingWarranty = await pb.collection("product_warranty")
          .getFirstListItem(`product_id="${id}"`);

        // Update existing record
        const updatedWarranty = await pb.collection("product_warranty")
          .update(existingWarranty.id, relatedData.warranty);

        updates.warranty = updatedWarranty;
      } catch (err) {
        // No warranty record found, create a new one
        const warrantyData = {
          ...relatedData.warranty,
          product_id: id
        };

        const newWarranty = await pb.collection("product_warranty").create(warrantyData);
        updates.warranty = newWarranty;
      }
    }

    console.log('All updates completed:', updates);

    // Return result with all updated data
    return {
      success: true,
      message: "Product and related data updated successfully",
      data: updates
    };
  } catch (error) {
    console.error(`Error updating product ${id} with related data:`, error);
    return {
      success: false,
      message: error.message || "Failed to update product",
      error
    };
  }
}

// 3. FUNCTION TO UPDATE JUST ONE RELATED DATA TYPE
// Updates just pricing, specifications, stock, or warranty
export async function updateProductRelatedData(productId, dataType, data) {
  try {
    // Determine which collection to update based on dataType
    let collectionName;
    switch (dataType.toLowerCase()) {
      case 'pricing':
        collectionName = "product_pricing";
        break;
      case 'specifications':
        collectionName = "product_specifications";
        break;
      case 'stock':
        collectionName = "product_stocks";
        break;
      case 'warranty':
        collectionName = "product_warranty";
        break;
      default:
        return {
          success: false,
          message: `Unknown data type: ${dataType}`
        };
    }

    // Try to find and update the existing record
    try {
      const existingRecord = await pb.collection(collectionName)
        .getFirstListItem(`product_id="${productId}"`);

      // Update the existing record
      const updatedRecord = await pb.collection(collectionName)
        .update(existingRecord.id, data);

      return {
        success: true,
        message: `${dataType} data updated successfully`,
        data: updatedRecord
      };
    } catch (err) {
      // Record doesn't exist, create a new one instead
      const recordData = {
        ...data,
        product_id: productId
      };

      const newRecord = await pb.collection(collectionName).create(recordData);

      return {
        success: true,
        message: `${dataType} data created successfully (no existing record found)`,
        data: newRecord
      };
    }
  } catch (error) {
    console.error(`Error updating ${dataType} data for product ${productId}:`, error);
    return {
      success: false,
      message: error.message || `Failed to update ${dataType} data`,
      error
    };
  }
}

// 4. FUNCTION TO UPDATE STOCK QUANTITY
// Specialized function for the common task of updating just the stock count
export async function updateProductStockQuantity(productId, newQuantity) {
  try {
    // Try to find the existing stock record
    try {
      const existingStock = await pb.collection("product_stocks")
        .getFirstListItem(`product_id="${productId}"`);

      // Update just the quantity
      const updatedStock = await pb.collection("product_stocks")
        .update(existingStock.id, { stock_quantity: newQuantity });

      return {
        success: true,
        message: "Stock quantity updated successfully",
        data: updatedStock
      };
    } catch (err) {
      // No stock record exists, create a new one
      const newStock = await pb.collection("product_stocks").create({
        product_id: productId,
        stock_quantity: newQuantity
      });

      return {
        success: true,
        message: "Stock record created successfully",
        data: newStock
      };
    }
  } catch (error) {
    console.error(`Error updating stock quantity for product ${productId}:`, error);
    return {
      success: false,
      message: error.message || "Failed to update stock quantity",
      error
    };
  }
}

// 5. FUNCTION TO UPDATE MULTIPLE PRODUCTS' RELATED DATA
// For batch operations like updating discount on multiple products at once
export async function updateBatchProductsRelatedData(productIds, data) {
  // Validate productIds is an array
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {
      success: false,
      message: "No valid product IDs provided"
    };
  }

  const results = {
    success: true,
    totalCount: productIds.length,
    successCount: 0,
    failedCount: 0,
    failedIds: []
  };

  // Process each product update one by one
  for (const id of productIds) {
    try {
      // First, find the pricing record for this product
      try {
        const existingPricing = await pb.collection("product_pricing")
          .getFirstListItem(`product_id="${id}"`);

        // Update only the specified fields (e.g., discount)
        const updateData = {};
        if (data.discount !== undefined) {
          updateData.discount = parseFloat(data.discount);

          // If we're updating discount, recalculate the final price
          if (existingPricing.base_price) {
            const basePrice = parseFloat(existingPricing.base_price);
            updateData.final_price = basePrice * (1 - (updateData.discount / 100));
          }
        }

        // Update the pricing record
        await pb.collection("product_pricing")
          .update(existingPricing.id, updateData);

        results.successCount++;
      } catch (err) {
        // No pricing record found, create a new one if we have discount data
        if (data.discount !== undefined) {
          // For new pricing records, we need base_price and final_price
          // Since we don't have base price, we'll set default values
          const pricingData = {
            product_id: id,
            base_price: 0,
            discount: parseFloat(data.discount),
            final_price: 0 // Will be 0 since base price is 0
          };

          await pb.collection("product_pricing").create(pricingData);
          results.successCount++;
        } else {
          throw new Error("No pricing record found and insufficient data to create one");
        }
      }
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      results.failedCount++;
      results.failedIds.push(id);
      // Continue with other updates even if one fails
    }
  }

  // Update the overall success status
  if (results.failedCount > 0) {
    results.success = false;
    results.message = `${results.successCount} products updated successfully, ${results.failedCount} failed`;
  } else {
    results.message = `All ${results.successCount} products updated successfully`;
  }

  return results;
}