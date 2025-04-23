"use client";

import CartItem from '@/components/v1/cart/CartItem'
import CartSummary from '@/components/v1/cart/CartSummary'
import AddressForm from '@/components/v1/checkout/AddressForm'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { getProductWithAllData } from '@/services/pocketbase/readProducts'
import { pb } from '@/lib/pocketbase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CartPage = () => {
  const { user, isUserLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [processingItems, setProcessingItems] = useState({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressError, setAddressError] = useState(null);

  const fetchCartFromDB = async (userId) => {
    try {
      const result = await pb.collection("user_cart").getFullList({
        filter: `user = "${userId}"`,
        expand: "product",
        requestKey: null
      });
      return result;
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      return [];
    }
  };

  const processCartItem = async (item) => {
    if (!item.expand?.product?.id) return null;

    setProcessingItems(prev => ({ ...prev, [item.id]: true }));

    try {
      const productDetails = await getProductWithAllData(item.expand.product.id);

      const formattedProduct = {
        id: item.id,
        productId: productDetails.id,
        name: productDetails.product_name || "Unknown Product",
        price: productDetails.pricing?.final_price || productDetails.pricing?.base_price || 0,
        stock: productDetails.stock?.stock_quantity || 10,
        image: productDetails.image ?
          pb.files.getUrl(productDetails, productDetails.image) :
          '/Images/sample_product.jpg',
        quantity: item.quantity || 1,
        model: productDetails.product_model || "",
        brand: productDetails.brand || "",
      };

      return formattedProduct;
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);

      return {
        id: item.id,
        productId: item.expand?.product?.id,
        name: item.expand?.product?.product_name || "Product",
        price: 0,
        stock: 10,
        image: '/Images/sample_product.jpg',
        quantity: item.quantity || 1,
        model: "",
        brand: "",
      };
    } finally {
      setProcessingItems(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    }
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) {
        if (!isUserLoading) {
          setLoading(false);
          setError("Please log in to view your cart");
        }
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching cart for user:", user.id);

        const userCartItems = await fetchCartFromDB(user.id);

        if (userCartItems.length === 0) {
          console.log("No cart items found");
          setCartItems([]);
          setLoading(false);
          return;
        }

        const processedItems = await Promise.all(
          userCartItems.map(processCartItem)
        );

        const validItems = processedItems.filter(Boolean);
        console.log("Processed cart items:", validItems.length);

        setCartItems(validItems);
      } catch (err) {
        console.error("Error processing cart:", err);
        setError(`Failed to load cart: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user, isUserLoading]);

  const handleQuantityChange = async (id, newQuantity) => {
    try {
      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      await pb.collection("user_cart").update(id, {
        quantity: newQuantity
      }, {
        requestKey: null
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      setCartItems(prev => [...prev]);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      setCartItems(items => items.filter(item => item.id !== id));
      setSelectedItems(selected => {
        const newSelected = { ...selected };
        delete newSelected[id];
        return newSelected;
      });

      await pb.collection("user_cart").delete(id, {
        requestKey: null
      });
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleCheckChange = (id, checked) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allSelected = {};
      cartItems.forEach(item => {
        allSelected[item.id] = true;
      });
      setSelectedItems(allSelected);
    } else {
      setSelectedItems({});
    }
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const isAllSelected = selectedCount === cartItems.length && cartItems.length > 0;

  const subtotal = cartItems.reduce((sum, item) => {
    if (selectedItems[item.id]) {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0);

  // Helper function to construct full address from parts if needed
  const constructFullAddress = (addressData) => {
    const parts = [
      addressData.streetAddress,
      addressData.barangayName && `Brgy. ${addressData.barangayName}`,
      addressData.cityName,
      addressData.provinceName,
      addressData.regionName
    ].filter(Boolean);

    return parts.join(', ');
  };

  // Create and save a new address if needed
  const createNewAddress = async (addressData) => {
    try {
      // Format the address data for storage
      const newAddress = await pb.collection("delivery_information").create({
        user: user.id,
        name: addressData.name,
        phone: addressData.phone,
        address: addressData.address || constructFullAddress(addressData), // Use the constructed address or provided address string
        city: addressData.cityName || addressData.city, // Store the city name
        zip_code: addressData.zip_code,
        additional_notes: addressData.additional_notes || ""
      });
      return newAddress;
    } catch (error) {
      console.error("Error creating new address:", error);
      throw error;
    }
  };

  const createOrderInDatabase = async (orderDetails) => {
    try {
      const dbPaymentMethod =
        orderDetails.paymentMethod === 'cash_on_delivery'
          ? 'Cash On Delivery'
          : orderDetails.paymentMethod === 'in_store'
            ? 'On-Store'
            : 'Cash On Delivery';

      const selectedProductIds = cartItems
        .filter(item => selectedItems[item.id])
        .map(item => item.productId);

      if (selectedProductIds.length === 0) {
        throw new Error("No products selected");
      }

      let addressId = null;
      if (dbPaymentMethod === 'Cash On Delivery') {
        if (!selectedAddress) {
          throw new Error("Please select or add a delivery address");
        }

        if (selectedAddress.isNew) {
          const newAddress = await createNewAddress(selectedAddress);
          addressId = newAddress.id;
        } else {
          addressId = selectedAddress.id;
        }
      }

      const order = await pb.collection("user_order").create({
        user: user.id,
        status: "Pending",
        products: selectedProductIds,
        mode_of_payment: dbPaymentMethod,
        address: addressId,
        delivery_fee: orderDetails.shipping || 0,
      }, {
        requestKey: null
      });

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleCheckout = (checkoutDetails) => {
    setPendingCheckout(checkoutDetails);
    if (checkoutDetails.paymentMethod === 'cash_on_delivery') {
      setAddressError(null);
    }
    setConfirmationOpen(true);
  };

  const processConfirmedCheckout = async () => {
    if (!pendingCheckout) return;

    if (pendingCheckout.paymentMethod === 'cash_on_delivery' && !selectedAddress) {
      setAddressError("Please select or add a delivery address");
      return;
    }

    try {
      setIsProcessing(true);

      const order = await createOrderInDatabase(pendingCheckout);

      const selectedCartIds = Object.keys(selectedItems).filter(id => selectedItems[id]);

      await Promise.all(selectedCartIds.map(id =>
        pb.collection("user_cart").delete(id, {
          requestKey: null
        })
      ));

      setCartItems(items => items.filter(item => !selectedItems[item.id]));
      setSelectedItems({});
      setConfirmationOpen(false);

      toast.success("Order placed successfully! Our team will contact you soon.");
    } catch (error) {
      console.error("Failed to process checkout:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSelected = async () => {
    try {
      const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);

      setCartItems(items => items.filter(item => !selectedItems[item.id]));
      setSelectedItems({});

      await Promise.all(selectedIds.map(id =>
        pb.collection("user_cart").delete(id, {
          requestKey: null
        })
      ));
    } catch (error) {
      console.error("Error removing selected items:", error);
    }
  };

  const handleAddressChange = (address) => {
    setSelectedAddress(address);
    setAddressError(null);
  };

  if (loading || isUserLoading) {
    return (
      <div className='px-4 md:px-8 lg:px-16 xl:px-96 py-8'>
        <div className='flex flex-col items-center justify-center py-20'>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className='mt-4 text-muted-foreground'>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='px-4 md:px-8 lg:px-16 xl:px-96 py-8'>
        <div className='text-center py-16'>
          <p className='text-xl text-destructive'>{error}</p>
          {!user && (
            <Button className='mt-4' onClick={() => window.location.href = '/authentication'}>
              Log in to view your cart
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='px-4 md:px-8 lg:px-16 xl:px-96 py-8'>
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your order</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to place an order for {selectedCount} item(s) with a total of ₱
              {(pendingCheckout?.total || 0).toFixed(2)}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingCheckout?.paymentMethod === 'cash_on_delivery' && (
            <div className="my-4">
              <h3 className="text-sm font-medium mb-2">
                Delivery details:
              </h3>

              <AddressForm
                userId={user?.id}
                onAddressChange={handleAddressChange}
              />

              {addressError && (
                <p className="text-destructive text-sm mt-2">{addressError}</p>
              )}

              <div className="text-sm mt-4 text-muted-foreground">
                Delivery fee: ₱{pendingCheckout?.shipping.toFixed(2)}
              </div>
            </div>
          )}

          {pendingCheckout?.paymentMethod === 'in_store' && (
            <div className="my-4 text-sm">
              <p>You'll need to pick up your items at our store:</p>
              <p className="mt-2 p-3 bg-muted/30 rounded-md">
                123 Main Street, Davao City<br />
                Open Monday - Saturday, 9am to 6pm
              </p>
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isProcessing}
              onClick={(e) => {
                e.preventDefault();
                processConfirmedCheckout();
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, place my order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cartItems.length === 0 ? (
        <div className='text-center py-16 bg-white rounded-lg shadow-sm'>
          <p className='text-xl text-muted-foreground'>Your cart is empty</p>
          <Button className='mt-4' onClick={() => window.location.href = '/shop'}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 bg-white rounded-lg p-6 shadow-sm'>
            <div className='flex justify-between items-center mb-4'>
              <div className='flex items-center'>
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                <label htmlFor="select-all" className='text-sm font-medium'>
                  Select All ({cartItems.length} items)
                </label>
              </div>
              <Button
                variant="ghost"
                className='text-destructive hover:text-destructive'
                disabled={selectedCount === 0}
                onClick={handleRemoveSelected}
              >
                Remove Selected
              </Button>
            </div>

            <Separator className='mb-4' />

            <div className='space-y-2'>
              {Object.keys(processingItems).length > 0 && (
                <div className='flex items-center justify-center p-4 bg-muted/20 rounded-md'>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className='text-sm text-muted-foreground'>Loading additional items...</span>
                </div>
              )}

              {cartItems.map(item => (
                <CartItem
                  key={item.id}
                  product={item}
                  checked={!!selectedItems[item.id]}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  onCheckChange={handleCheckChange}
                />
              ))}
            </div>
          </div>

          <CartSummary
            selectedCount={selectedCount}
            subtotal={subtotal}
            disabled={selectedCount === 0}
            onCheckout={handleCheckout}
          />
        </div>
      )}
    </div>
  );
};

export default CartPage;