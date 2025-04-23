// Import the PocketBase client from our lib folder
import { pb } from "../../lib/pocketbase";

// 1. FUNCTION TO CREATE A NEW PRODUCT WITH BASIC INFO
// This creates just the main product record
export async function createBasicProduct(productData) {
  try {
    console.log('Creating basic product with data:', productData);

    // Create the product record with basic information
    const newProduct = await pb.collection("products").create(productData);
    console.log('New product created:', newProduct);

    return {
      success: true,
      message: "Product created successfully",
      product: newProduct
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
      error
    };
  }
}

// 2. FUNCTION TO CREATE A COMPLETE PRODUCT WITH ALL RELATED DATA
// This creates the product with all its related data (pricing, specs, stock, warranty)
export async function createProductWithAllData(productData, relatedData = {}) {
  try {
    console.log('Creating complete product with data:', {
      productData,
      relatedData
    });

    // 1. First create the base product
    const newProduct = await pb.collection("products").create(productData);
    console.log('Base product created:', newProduct);

    const productId = newProduct.id;

    // Keep track of created related records
    const createdRecords = {
      product: newProduct
    };

    // 2. Create related records if provided

    // Create pricing record if data is provided
    if (relatedData.pricing) {
      try {
        // Add the product_id field to connect it to the main product
        const pricingData = {
          ...relatedData.pricing,
          product_id: productId
        };
        console.log('Creating pricing record with data:', pricingData);

        const pricing = await pb.collection("product_pricing").create(pricingData);
        console.log('Pricing record created:', pricing);
        createdRecords.pricing = pricing;
      } catch (err) {
        console.error("Error creating pricing data:", err);
        // Continue with other creations even if this one fails
      }
    }

    // Create specifications record if data is provided
    if (relatedData.specifications) {
      try {
        const specsData = {
          ...relatedData.specifications,
          product_id: productId
        };
        console.log('Creating specifications record with data:', specsData);

        const specs = await pb.collection("product_specifications").create(specsData);
        console.log('Specifications record created:', specs);
        createdRecords.specifications = specs;
      } catch (err) {
        console.error("Error creating specifications data:", err);
      }
    }

    // Create stock record if data is provided
    if (relatedData.stock) {
      try {
        const stockData = {
          ...relatedData.stock,
          product_id: productId
        };
        console.log('Creating stock record with data:', stockData);

        const stock = await pb.collection("product_stocks").create(stockData);
        console.log('Stock record created:', stock);
        createdRecords.stock = stock;
      } catch (err) {
        console.error("Error creating stock data:", err);
      }
    }

    // Create warranty record if data is provided
    if (relatedData.warranty) {
      try {
        const warrantyData = {
          ...relatedData.warranty,
          product_id: productId
        };
        console.log('Creating warranty record with data:', warrantyData);

        const warranty = await pb.collection("product_warranty").create(warrantyData);
        console.log('Warranty record created:', warranty);
        createdRecords.warranty = warranty;
      } catch (err) {
        console.error("Error creating warranty data:", err);
      }
    }

    console.log('All related records created:', createdRecords);

    // Return the created product and its related records
    return {
      success: true,
      message: "Product with related data created successfully",
      data: createdRecords
    };
  } catch (error) {
    console.error("Error creating product with related data:", error);
    return {
      success: false,
      message: error.message || "Failed to create product",
      error
    };
  }
}

// 3. FUNCTION TO ADD A SINGLE RELATED RECORD TO AN EXISTING PRODUCT
// Useful for adding just pricing, specifications, stock, or warranty to an existing product
export async function addProductRelatedData(productId, dataType, data) {
  try {
    console.log(`Adding ${dataType} data to product ${productId} with data:`, data);

    // Determine which collection to add to based on dataType
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

    // Check if a record already exists
    try {
      await pb.collection(collectionName).getFirstListItem(`product_id="${productId}"`);
      // If we reach here, a record exists, so we return false
      console.log(`A ${dataType} record already exists for product ${productId}.`);
      return {
        success: false,
        message: `A ${dataType} record already exists for this product. Use update instead.`
      };
    } catch (err) {
      // No record found, so we can create a new one - this is expected
      console.log(`No existing ${dataType} record found for product ${productId}. Proceeding to create.`);
    }

    // Add the product_id to connect it to the main product
    const recordData = {
      ...data,
      product_id: productId
    };

    // Create the record
    const newRecord = await pb.collection(collectionName).create(recordData);
    console.log(`${dataType} record created successfully for product ${productId}:`, newRecord);

    return {
      success: true,
      message: `${dataType} data added successfully`,
      data: newRecord
    };
  } catch (error) {
    console.error(`Error adding ${dataType} data to product ${productId}:`, error);
    return {
      success: false,
      message: error.message || `Failed to add ${dataType} data`,
      error
    };
  }
}