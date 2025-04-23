"use client";
import React, { useState, useEffect, useMemo } from 'react'
import SearchFilter from '../components/v1/SearchFilter'
import ProductCard from '../components/v1/ProductCard'
import { getProductsWithAllData } from '../services/pocketbase/readProducts'

const Page = () => {
  // State for all products (fetched once)
  const [allProducts, setAllProducts] = useState([]);
  // State for filtered products (displayed to user)
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products on component mount (only once)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching all products once...');
        const result = await getProductsWithAllData(1, 100); // Increase limit as needed
        setAllProducts(result.items);
        setFilteredProducts(result.items); // Initially show all products
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Client-side search and filter function
  const handleSearch = (query, filters) => {
    console.log('Client-side search with:', {
      query: query || '(empty)',
      filters
    });

    // Force showing all products when search is empty and filters are default
    if ((!query || query === '') && filters.price === 'All' && filters.category === 'All') {
      console.log('No filters active, showing all products');
      setFilteredProducts(allProducts);
      return;
    }

    // Filter products based on search query and filters
    const filtered = allProducts.filter(product => {
      let matchesSearch = true;
      let matchesPrice = true;
      let matchesCategory = true;

      // Filter by search query - only if there's actually a query
      if (query && query !== '') {
        matchesSearch = product.product_name?.toLowerCase().includes(query.toLowerCase());
      }

      // Filter by price range
      if (filters.price !== 'All') {
        const price = product.pricing?.final_price || product.pricing?.base_price || 0;

        // Parse the price range
        if (filters.price === '0-50') {
          matchesPrice = price < 50;
        } else if (filters.price === '50-100') {
          matchesPrice = price >= 50 && price < 100;
        } else if (filters.price === '100-200') {
          matchesPrice = price >= 100 && price < 200;
        } else if (filters.price === '200+') {
          matchesPrice = price >= 200;
        }
      }

      // Filter by category
      if (filters.category !== 'All') {
        // Convert from URL-friendly format (e.g., 'air-conditioners') to regular text if needed
        const categoryValue = filters.category.replace(/-/g, ' ');

        // Check if product matches the selected category
        // Assuming product has a category attribute or we're using product type/model to determine category
        matchesCategory =
          product.brand?.toLowerCase().includes(categoryValue.toLowerCase()) ||
          product.product_model?.toLowerCase().includes(categoryValue.toLowerCase());
      }

      // Product must match all active filters
      return matchesSearch && matchesPrice && matchesCategory;
    });

    console.log(`Filtering complete: ${filtered.length} products match criteria`);
    setFilteredProducts(filtered);
  };

  // Map PocketBase products to the format expected by ProductCard
  const formatProduct = useMemo(() => (product) => {
    return {
      id: product.id,
      name: product.product_name,
      image: product.image ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.image}` : '/Images/sample_product.jpg',
      price: product.pricing?.final_price || product.pricing?.base_price || 0,
      stock: product.stock?.stock_quantity || 0,
      currency: '$'
    };
  }, []);

  return (
    <div className="bg-[#EAEFF8] w-full h-full overflow-y-scroll">
      <div className="px-96 py-4 gap-5 flex flex-col">

        {/* Search Filter */}
        <SearchFilter onSearch={handleSearch} />

        {/* Product Display Section */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-600">No products found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={formatProduct(product)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Page