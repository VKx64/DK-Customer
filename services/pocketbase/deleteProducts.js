// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// 1. FUNCTION TO DELETE A PRODUCT AND ITS RELATED DATA
// This function removes a product and all its related records from other collections
export async function deleteProductWithAllData(id) {
  try {
    console.log(`Deleting product with ID: ${id} and all its related data`);

    // First, delete all related records in other collections
    try {
      // Find and delete any related pricing records
      const pricingRecord = await pb.collection("product_pricing")
        .getFirstListItem(`product_id="${id}"`);
      if (pricingRecord) {
        console.log(`Found pricing record ${pricingRecord.id}, deleting...`);
        await pb.collection("product_pricing").delete(pricingRecord.id);
        console.log('Pricing record deleted successfully');
      }
    } catch (err) {
      console.log('No pricing record found to delete');
      // No pricing record found, continue with other deletions
    }

    try {
      // Find and delete any related specifications records
      const specificationsRecord = await pb.collection("product_specifications")
        .getFirstListItem(`product_id="${id}"`);
      if (specificationsRecord) {
        await pb.collection("product_specifications").delete(specificationsRecord.id);
      }
    } catch (err) {
      // No specifications record found, continue with other deletions
    }

    try {
      // Find and delete any related stock records
      const stockRecord = await pb.collection("product_stocks")
        .getFirstListItem(`product_id="${id}"`);
      if (stockRecord) {
        await pb.collection("product_stocks").delete(stockRecord.id);
      }
    } catch (err) {
      // No stock record found, continue with other deletions
    }

    try {
      // Find and delete any related warranty records
      const warrantyRecord = await pb.collection("product_warranty")
        .getFirstListItem(`product_id="${id}"`);
      if (warrantyRecord) {
        await pb.collection("product_warranty").delete(warrantyRecord.id);
      }
    } catch (err) {
      // No warranty record found, continue with other deletions
    }

    // Finally, delete the main product record
    console.log(`Deleting main product record: ${id}`);
    await pb.collection("products").delete(id);
    console.log('Main product record deleted successfully');

    return {
      success: true,
      message: "Product and all related data deleted successfully"
    };
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return {
      success: false,
      message: error.message || "Failed to delete product"
    };
  }
}

// 2. FUNCTION TO DELETE MULTIPLE PRODUCTS AT ONCE
// Accepts an array of product IDs to delete
export async function deleteManyProducts(productIds) {
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

  // Process each product deletion one by one
  for (const id of productIds) {
    const result = await deleteProductWithAllData(id);

    if (result.success) {
      results.successCount++;
    } else {
      results.failedCount++;
      results.failedIds.push(id);
      // Continue with other deletions even if one fails
    }
  }

  // Update the overall success status
  if (results.failedCount > 0) {
    results.success = false;
    results.message = `${results.successCount} products deleted successfully, ${results.failedCount} failed`;
  } else {
    results.message = `All ${results.successCount} products deleted successfully`;
  }

  return results;
}

// 3. FUNCTION TO DELETE JUST ONE RELATED RECORD TYPE
// Useful when you want to remove only pricing, specifications, stock, or warranty
export async function deleteProductRelatedData(productId, dataType) {
  try {
    // Determine which collection to delete from based on dataType
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

    // Find the record to delete
    try {
      const record = await pb.collection(collectionName)
        .getFirstListItem(`product_id="${productId}"`);

      if (record) {
        await pb.collection(collectionName).delete(record.id);
        return {
          success: true,
          message: `${dataType} data deleted successfully`
        };
      }
    } catch (err) {
      // No record found
      return {
        success: false,
        message: `No ${dataType} data found for this product`
      };
    }
  } catch (error) {
    console.error(`Error deleting ${dataType} data for product ${productId}:`, error);
    return {
      success: false,
      message: error.message || `Failed to delete ${dataType} data`
    };
  }
}