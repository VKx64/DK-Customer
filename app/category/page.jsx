"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AirVent, Package } from "lucide-react";
import { toast } from "sonner";

const Page = () => {
  const router = useRouter();
  const [compressorTypes, setCompressorTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompressorTypes = async () => {
      try {
        setLoading(true);

        // Fetch all product specifications with their products
        const specs = await pb.collection("product_specifications").getFullList({
          expand: "product_id",
          requestKey: null, // Prevent auto-cancellation
        });

        // Extract unique compressor types and count products for each
        const typeMap = {};
        specs.forEach((spec) => {
          if (spec.compressorType && spec.expand?.product_id) {
            const type = spec.compressorType.trim();
            if (!typeMap[type]) {
              typeMap[type] = {
                name: type,
                count: 0,
                products: []
              };
            }
            typeMap[type].count++;
            typeMap[type].products.push(spec.expand.product_id);
          }
        });

        // Convert to array and sort by count (most products first)
        const typesArray = Object.values(typeMap).sort((a, b) => b.count - a.count);

        console.log("Compressor types found:", typesArray);
        setCompressorTypes(typesArray);
      } catch (error) {
        console.error("Error fetching compressor types:", error);
        toast.error("Failed to load air conditioner categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCompressorTypes();
  }, []);

  const handleCategoryClick = (type) => {
    // Navigate to products page with compressor type filter
    router.push(`/?compressorType=${encodeURIComponent(type)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center relative py-8 px-4">
        <article className="w-full max-w-6xl">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative py-8 px-4">
      <article className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-black text-4xl font-bold mb-2">
            Air Conditioner Categories
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse by compressor type to find the perfect air conditioner for your needs
          </p>
        </div>

        {compressorTypes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Package className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
                <p className="text-muted-foreground">
                  Air conditioner categories will appear here once products are added
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {compressorTypes.map((type, index) => (
              <Card
                key={index}
                className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary"
                onClick={() => handleCategoryClick(type.name)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <AirVent className="w-10 h-10 text-primary" />
                    </div>

                    {/* Category Name */}
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {type.name}
                      </h3>
                      <Badge variant="secondary" className="font-semibold">
                        {type.count} {type.count === 1 ? "Product" : "Products"}
                      </Badge>
                    </div>

                    {/* Description based on type */}
                    <p className="text-sm text-muted-foreground">
                      {getTypeDescription(type.name)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

// Helper function to provide descriptions for common compressor types
const getTypeDescription = (typeName) => {
  const lowerType = typeName.toLowerCase();

  if (lowerType.includes("inverter")) {
    return "Energy-efficient technology that adjusts cooling capacity based on room temperature";
  }
  if (lowerType.includes("dual") || lowerType.includes("twin")) {
    return "Advanced dual compressor system for enhanced cooling performance";
  }
  if (lowerType.includes("rotary")) {
    return "Smooth and quiet operation with rotary compressor technology";
  }
  if (lowerType.includes("scroll")) {
    return "Reliable scroll compressor design for consistent cooling";
  }
  if (lowerType.includes("reciprocating")) {
    return "Traditional piston-based compressor for effective cooling";
  }

  return "High-quality air conditioning solution";
};

export default Page;
