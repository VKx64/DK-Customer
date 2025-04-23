"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Loader2,
  CheckCircle,
  Plus,
  Minus,
  Info,
  Check,
  X,
  Package,
  Tag,
  CircleDollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { getProductWithAllData } from "@/services/pocketbase/readProducts";

const ProductDetailsDialog = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  useEffect(() => {
    if (!isOpen) {
      setQuantity(1);
      setIsAddedToCart(false);
    }
  }, [isOpen]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const productData = await getProductWithAllData(productId);
      setProduct(productData);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError("Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (product?.stock?.stock_quantity && quantity < product.stock.stock_quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      if (product?.stock?.stock_quantity) {
        setQuantity(Math.min(value, product.stock.stock_quantity));
      } else {
        setQuantity(value);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to your cart");
      return;
    }

    setIsAddingToCart(true);

    try {
      const existingCartItems = await pb.collection("user_cart").getList(1, 1, {
        filter: `user.id = "${user.id}" && product.id = "${productId}"`,
        requestKey: null
      });

      if (existingCartItems.items.length > 0) {
        const existingItem = existingCartItems.items[0];
        const newQuantity = existingItem.quantity + quantity;

        await pb.collection("user_cart").update(existingItem.id, {
          quantity: newQuantity
        }, {
          requestKey: null
        });
        toast.success(`Updated quantity in cart (${newQuantity} items)`);
      } else {
        await pb.collection("user_cart").create({
          product: productId,
          user: user.id,
          quantity: quantity
        }, {
          requestKey: null
        });
        toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
      }

      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Price unavailable";

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const getStockStatus = () => {
    const stockQty = product?.stock?.stock_quantity || 0;

    if (stockQty <= 0) return { label: "Out of Stock", color: "destructive" };
    if (stockQty <= 5) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  const calculateDiscountPercentage = () => {
    if (!product?.pricing?.base_price ||
        !product?.pricing?.final_price ||
        product.pricing.base_price <= product.pricing.final_price) {
      return null;
    }

    const discount = product.pricing.base_price - product.pricing.final_price;
    const percentage = (discount / product.pricing.base_price) * 100;
    return Math.round(percentage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isLoading ? "Loading Product Details..." : error ? "Error" : product?.product_name || "Product Details"}
          </DialogTitle>
          {product?.brand && (
            <DialogDescription>
              <span className="font-medium">{product.brand}</span>
              {product.product_model && (
                <> • Model: <span className="font-medium">{product.product_model}</span></>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-[250px] w-full md:w-[300px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-12 w-1/3" />
                <div className="space-y-1 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchProductDetails} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : product ? (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative h-[250px] w-full rounded-lg overflow-hidden bg-gray-100">
                {product.image ? (
                  <Image
                    src={pb.files.getUrl(product, product.image)}
                    alt={product.product_name}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign size={16} className="text-green-600" />
                    <h3 className="font-medium">Pricing</h3>
                  </div>

                  {product.pricing?.base_price !== product.pricing?.final_price && product.pricing?.base_price > 0 && (
                    <div className="ml-5">
                      <span className="text-sm text-gray-500 line-through block">
                        Regular: {formatPrice(product.pricing.base_price)}
                      </span>
                    </div>
                  )}

                  <div className="ml-5">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(product.pricing?.final_price || product.pricing?.base_price || 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-600" />
                    <h3 className="font-medium">Availability</h3>
                  </div>

                  <div className="ml-5 mt-1 flex items-center">
                    {(() => {
                      const status = getStockStatus();
                      return (
                        <Badge variant={status.color}>{status.label}</Badge>
                      );
                    })()}

                    {product.stock?.stock_quantity > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {product.stock.stock_quantity} units available
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1 || isAddingToCart}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="text"
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="h-8 w-14 text-center rounded-none"
                        disabled={isAddingToCart}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        onClick={incrementQuantity}
                        disabled={(product?.stock?.stock_quantity && quantity >= product.stock.stock_quantity) || isAddingToCart}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>


                <Button
                  className="w-full mt-4"
                  disabled={
                    product?.stock?.stock_quantity <= 0 ||
                    isAddingToCart ||
                    isAddedToCart
                  }
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Cart...
                    </>
                  ) : isAddedToCart ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="specifications" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="pricing">Pricing Details</TabsTrigger>
                <TabsTrigger value="warranty">Warranty</TabsTrigger>
              </TabsList>

              <TabsContent value="specifications" className="p-4 border rounded-md mt-2">
                {product.specifications ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">HP Capacity:</span>
                      <span className="text-muted-foreground">
                        {product.specifications.hp_capacity || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">Refrigerant:</span>
                      <span className="text-muted-foreground">
                        {product.specifications.refrigerant || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">Compressor Type:</span>
                      <span className="text-muted-foreground">
                        {product.specifications.compressorType || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">Product ID:</span>
                      <span className="text-muted-foreground">{product.id}</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">Brand:</span>
                      <span className="text-muted-foreground">{product.brand || "Not specified"}</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">Model:</span>
                      <span className="text-muted-foreground">{product.product_model || "Not specified"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <X size={16} className="mr-2" />
                    No specifications available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="p-4 border rounded-md mt-2">
                {product.pricing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">Base Price:</span>
                        <span className="text-muted-foreground">
                          {formatPrice(product.pricing.base_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">Final Price:</span>
                        <span className="text-muted-foreground">
                          {formatPrice(product.pricing.final_price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">Discount:</span>
                        {product.pricing.discount > 0 ? (
                          <span className="text-muted-foreground">
                            {formatPrice(product.pricing.discount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No discount
                          </span>
                        )}
                      </div>

                      {calculateDiscountPercentage() && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                          <span className="font-medium">Discount Percentage:</span>
                          <Badge className="bg-red-500">
                            {calculateDiscountPercentage()}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <X size={16} className="mr-2" />
                    No pricing details available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="warranty" className="p-4 border rounded-md mt-2">
                {product.warranty ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">Duration:</span>
                        <span className="text-muted-foreground">
                          {product.warranty.duration || "Not specified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <span className="font-medium">Coverage:</span>
                        <span className="text-muted-foreground">
                          {product.warranty.coverage || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <X size={16} className="mr-2" />
                    No warranty information available
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
