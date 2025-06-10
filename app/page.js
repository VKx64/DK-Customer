"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import SearchFilter from "../components/v1/SearchFilter";
import ProductCard from "../components/v1/ProductCard";
import { getProductsWithAllData } from "../services/pocketbase/readProducts";

const Page = () => {
  // State for all products (fetched once)
  const [allProducts, setAllProducts] = useState([]);
  // State for filtered products (displayed to user)
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add state for search query and filters
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ price: "All", category: "All" });

  // Fetch all products on component mount (only once)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        console.log("Fetching all products once...");
        const result = await getProductsWithAllData(1, 100); // Increase limit as needed
        setAllProducts(result.items);
        setFilteredProducts(result.items); // Initially show all products
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Client-side search and filter function
  const handleSearch = useCallback(
    (query, filters) => {
      // Always filter by price and category, even if search is empty
      const filtered = allProducts.filter((product) => {
        let matchesSearch = true;
        if (query && query.trim() !== "") {
          matchesSearch = product.product_name
            ?.toLowerCase()
            .includes(query.toLowerCase());
        }

        let matchesPrice = true;
        let matchesCategory = true;

        // Filter by price range
        if (filters.price !== "All") {
          const price =
            product.pricing?.final_price || product.pricing?.base_price || 0;
          if (filters.price === "0-10,000") {
            matchesPrice = price >= 0 && price < 10000;
          } else if (filters.price === "10,000-20,000") {
            matchesPrice = price >= 10000 && price < 20000;
          } else if (filters.price === "20,000-30,000") {
            matchesPrice = price >= 20000 && price < 30000;
          } else if (filters.price === "30,000+") {
            matchesPrice = price >= 30000;
          }
        }

        // Filter by category
        if (filters.category !== "All") {
          const categoryValue = filters.category.replace(/-/g, " ");
          matchesCategory =
            product.brand
              ?.toLowerCase()
              .includes(categoryValue.toLowerCase()) ||
            product.product_model
              ?.toLowerCase()
              .includes(categoryValue.toLowerCase());
        }

        return matchesSearch && matchesPrice && matchesCategory;
      });

      setFilteredProducts(filtered);
    },
    [allProducts]
  );

  // Update filtered products whenever query or filters change
  useEffect(() => {
    handleSearch(query, filters);
  }, [query, filters, allProducts, handleSearch]);

  // Map PocketBase products to the format expected by ProductCard
  const formatProduct = useMemo(
    () => (product) => {
      const price =
        product.pricing?.final_price || product.pricing?.base_price || 0;
      return {
        id: product.id,
        name: product.product_name,
        image: product.image
          ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.image}`
          : "/Images/sample_product.jpg",
        price: price.toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
          minimumFractionDigits: 2,
        }),
        stock: product.stock?.stock_quantity || 0,
      };
    },
    []
  );

  return (
    <div className="bg-[#EAEFF8] w-full h-full overflow-y-scroll">
      <div className="px-96 py-4 gap-5 flex flex-col">
        {/* Pass filter state and setters to SearchFilter */}
        <SearchFilter
          onSearch={(q, f) => {
            setQuery(q);
            setFilters(f);
          }}
          query={query}
          filters={filters}
        />

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
            <p className="text-gray-600">
              No products found. Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={formatProduct(product)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
