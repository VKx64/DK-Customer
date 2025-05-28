"use client";

import React, { useEffect, useState } from "react";
import { getCategories } from "@/services/pocketbase/readCategory";

// Map category names to image paths
const categoryImages = {
  aircon: "/Images/simple_aircon.jpg",
  "air ventilation": "/Images/simple_ventilator.jpg",
  waifu: "/Images/default_user.jpg",
  // Add more mappings as needed
};

const getImageUrl = (categoryName) =>
  categoryImages[categoryName?.toLowerCase()] || "/Images/sample_product.jpg"; // fallback image

const Page = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center relative py-8">
      <article className="w-full max-w-5xl">
        <h2 className="text-black text-4xl font-medium mb-8">Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-md p-0 flex flex-col items-center overflow-hidden transition-transform hover:scale-105"
            >
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <img
                  src={getImageUrl(category.name)}
                  alt={category.name}
                  className="object-contain h-full"
                />
              </div>
              <div className="w-full p-4 flex justify-center">
                <span className="text-lg font-semibold text-center">
                  {category.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};

export default Page;
