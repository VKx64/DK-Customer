import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { ShoppingCart, Eye, CheckCircle, Loader2 } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProductDetailsDialog from './product/ProductDetailsDialog';

const ProductCard = ({ product }) => {
  // Default product data if none provided
  const {
    id = '1',
    name = 'Daikin Stylish Series AC',
    image = '/Images/default-product.jpg',
    price = 699.99,
    stock = 15,
    currency = '$'
  } = product || {};

  // States for handling cart interactions
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Authentication context for getting current user
  const { user } = useAuth();

  // Router for navigation
  const router = useRouter();

  // Handle view product details
  const handleViewProduct = (e) => {
    e.preventDefault();
    setIsDialogOpen(true);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    // If user is not logged in, redirect to authentication page
    if (!user) {
      toast.error("Please log in to add items to your cart");
      router.push('/authentication');
      return;
    }

    // Set loading state
    setIsAddingToCart(true);

    try {
      // Check if this product is already in the cart
      const existingCartItems = await pb.collection("user_cart").getList(1, 1, {
        filter: `user.id = "${user.id}" && product.id = "${id}"`,
        requestKey: null // Prevent auto-cancellation
      });

      if (existingCartItems.items.length > 0) {
        // If item already exists, update the quantity
        const existingItem = existingCartItems.items[0];
        const newQuantity = existingItem.quantity + 1;

        await pb.collection("user_cart").update(existingItem.id, {
          quantity: newQuantity
        }, {
          requestKey: null // Prevent auto-cancellation
        });
        toast.success("Item quantity updated in cart");
      } else {
        // If item doesn't exist, create new cart item
        await pb.collection("user_cart").create({
          product: id,  // Product ID relation
          user: user.id, // User ID relation
          quantity: 1    // Default quantity
        }, {
          requestKey: null // Prevent auto-cancellation
        });
        toast.success("Item added to cart");
      }

      // Show success state
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000); // Reset after 2 seconds

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <div className="group bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
        {/* Product Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{name}</h3>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{currency}{price.toLocaleString()}</p>
              <p className="text-sm text-gray-500">
                {stock > 0 ? (
                  <span className={stock > 5 ? 'text-green-600' : 'text-orange-500'}>
                    {stock > 5 ? 'In Stock' : 'Low Stock'} <span className="text-gray-400">({stock} left)</span>
                  </span>
                ) : (
                  <span className="text-red-500">Out of Stock</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={stock <= 0}
            onClick={handleViewProduct}
          >
            <Eye size={16} className="mr-1" /> View
          </Button>

          <Button
            variant="default"
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={stock <= 0 || isAddingToCart || isAddedToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" /> Adding...
              </>
            ) : isAddedToCart ? (
              <>
                <CheckCircle size={16} className="mr-1" /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={16} className="mr-1" /> Add
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        productId={id}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default ProductCard;