"use client";
import React, { useState, useRef, useCallback } from "react";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Search, ChevronDown } from "lucide-react";

const SearchFilter = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState("All");
  const [category, setCategory] = useState("All");

  // Use a debounce timeout ref to avoid recreating it on every render
  const debounceTimeout = useRef(null);

  // Price ranges
  const priceRanges = [
    { label: "All", value: "All" },
    { label: "₱0 - ₱10,000", value: "0-10,000" },
    { label: "₱10,000 - ₱20,000", value: "10,000-20,000" },
    { label: "₱20,000 - ₱30,000", value: "20,000-30,000" },
    { label: "₱30,000+", value: "30,000+" },
  ];

  // Categories
  const categories = [
    { label: "All", value: "All" },
    { label: "Air Conditioners", value: "air-conditioners" },
    { label: "Heat Pumps", value: "heat-pumps" },
    { label: "Air Purifiers", value: "air-purifiers" },
    { label: "Ventilation", value: "ventilation" },
    { label: "Accessories", value: "accessories" },
  ];

  // A stable search trigger function using useCallback to prevent recreation
  const triggerSearch = useCallback(() => {
    if (onSearch) {
      onSearch(searchQuery.trim(), { price: priceRange, category });
    }
  }, [searchQuery, priceRange, category, onSearch]);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      // Always reset price filter to "All" and search with updated filters
      setPriceRange("All");
      if (onSearch) {
        onSearch("", { price: "All", category });
      }
    } else {
      // Live search with current filters
      if (onSearch) {
        onSearch(value.trim(), { price: priceRange, category });
      }
    }
  };

  // Handle price filter change
  const handlePriceChange = (value) => {
    setPriceRange(value);

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout with a shorter delay for filters
    debounceTimeout.current = setTimeout(() => {
      // INCORRECT: This causes double-tap issue!
      // setFilters({ ...filters, price: newPrice });
      onSearch(searchQuery.trim(), { price: value, category }); // <-- filters is still the old value!
    }, 300);
  };

  // Handle category filter change
  const handleCategoryChange = (value) => {
    setCategory(value);

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout with a shorter delay for filters
    debounceTimeout.current = setTimeout(() => {
      triggerSearch();
    }, 300);
  };

  // Clean up timeout when component unmounts
  React.useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md w-full p-6 space-y-4">
      <div className="flex flex-row gap-2 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-8 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-row gap-3">
        <div className="filter-group">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed flex items-center gap-1"
              >
                <span className="text-sm font-medium">Price</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by price</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {priceRanges.map((range) => (
                <DropdownMenuItem
                  key={range.value}
                  onClick={() => handlePriceChange(range.value)}
                  className={
                    priceRange === range.value ? "bg-blue-50 text-blue-600" : ""
                  }
                >
                  {range.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="filter-group">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed flex items-center gap-1"
              >
                <span className="text-sm font-medium">Category</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={
                    category === cat.value ? "bg-blue-50 text-blue-600" : ""
                  }
                >
                  {cat.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter indicators */}
        <div className="flex flex-wrap gap-2 items-center ml-auto">
          {priceRange !== "All" && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full flex items-center">
              <span>
                {priceRanges.find((p) => p.value === priceRange)?.label}
              </span>
              <button
                className="ml-1.5 hover:text-blue-600"
                onClick={() => handlePriceChange("All")}
              >
                ×
              </button>
            </div>
          )}

          {category !== "All" && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full flex items-center">
              <span>{categories.find((c) => c.value === category)?.label}</span>
              <button
                className="ml-1.5 hover:text-blue-600"
                onClick={() => handleCategoryChange("All")}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchFilter);
