"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin, CreditCard, Home, Store } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * Calculates distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Earth radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  // Haversine formula calculation
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  // Distance in kilometers
  return R * c;
};

/**
 * Calculates shipping fee based on distance
 */
const calculateShippingFee = (distanceInKm) => {
  // Free delivery within 5 km
  if (distanceInKm <= 5) {
    return 0;
  }
  // 5-10 km = 500 pesos
  else if (distanceInKm <= 10) {
    return 500;
  }
  // 10-15 km = 1000 pesos
  else if (distanceInKm <= 15) {
    return 1000;
  }
  // Additional 500 pesos for each 5km bracket beyond 15km
  else {
    const additionalBrackets = Math.ceil((distanceInKm - 15) / 5);
    return 1000 + (additionalBrackets * 500);
  }
};

// Payment method constants
const PAYMENT_METHODS = {
  ONLINE_PAYMENT: "online_payment",
  CASH_ON_DELIVERY: "cash_on_delivery",
  IN_STORE: "in_store"
};

/**
 * Cart Summary Component
 * Shows order summary and payment options
 */
const CartSummary = ({
  selectedCount = 0,
  subtotal = 0,
  disabled = true,
  onCheckout
}) => {
  // State variables
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [shipping, setShipping] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH_ON_DELIVERY);

  // Get shop coordinates from environment variables
  const shopLatitude = parseFloat(process.env.NEXT_PUBLIC_SHOP_LATITUDE || "6.1145877");
  const shopLongitude = parseFloat(process.env.NEXT_PUBLIC_SHOP_LONGITUDE || "125.1802737");

  // Get user location when cash on delivery is selected
  useEffect(() => {
    // Skip location check if payment method is not cash on delivery
    if (paymentMethod !== PAYMENT_METHODS.CASH_ON_DELIVERY) {
      setShipping(0);
      setDistance(null);
      setLocationError(null);
      return;
    }

    // Function to get user's location
    const getUserLocation = () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationError("Your browser doesn't support location services. Using default shipping rate.");
        setShipping(500);
        return;
      }

      // Show loading indicator
      setIsLoading(true);

      // Request user's location
      navigator.geolocation.getCurrentPosition(
        // Success handler
        (position) => {
          // Get coordinates
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          // Calculate distance to shop
          const calculatedDistance = calculateDistance(
            latitude, longitude, shopLatitude, shopLongitude
          );
          setDistance(calculatedDistance);

          // Calculate shipping fee based on distance
          const fee = calculateShippingFee(calculatedDistance);
          setShipping(fee);

          // Hide loading indicator
          setIsLoading(false);
        },

        // Error handler
        (error) => {
          console.error("Location error:", error);
          setLocationError("Could not get your location. Using default shipping rate.");
          setShipping(500);
          setIsLoading(false);
        },

        // Options
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    // Call the function to get user location
    getUserLocation();
  }, [paymentMethod, shopLatitude, shopLongitude]);

  // Calculate total including shipping (no tax)
  const totalAmount = subtotal + shipping;

  // Payment method options
  const paymentOptions = [
    {
      id: PAYMENT_METHODS.ONLINE_PAYMENT,
      label: "Online Payment",
      description: "Pay securely online (Coming soon)",
      icon: <CreditCard className="h-4 w-4 mr-2 text-primary" />,
      disabled: true,
      badge: "Coming Soon"
    },
    {
      id: PAYMENT_METHODS.CASH_ON_DELIVERY,
      label: "Cash on Delivery",
      description: "Pay when your order arrives",
      icon: <Home className="h-4 w-4 mr-2 text-primary" />,
      disabled: false
    },
    {
      id: PAYMENT_METHODS.IN_STORE,
      label: "In-Store Purchase",
      description: "Pay at our physical store",
      icon: <Store className="h-4 w-4 mr-2 text-primary" />,
      disabled: false
    }
  ];

  // Handle checkout button click
  const handleCheckoutClick = () => {
    if (onCheckout) {
      onCheckout({
        paymentMethod,
        shipping,
        total: totalAmount
      });
    }
  };

  return (
    <div className='bg-white rounded-lg p-6 shadow-sm h-fit'>
      <h2 className='text-lg font-bold mb-4'>Order Summary</h2>

      <div className='space-y-5'>
        {/* Order details section */}
        <div className='space-y-3 text-sm'>
          {/* Subtotal */}
          <div className='flex justify-between'>
            <span>Subtotal ({selectedCount} items)</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>

          {/* Shipping - only shown for cash on delivery */}
          {paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY && (
            <>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-1'>
                  <MapPin className="h-4 w-4" />
                  <span>Shipping</span>
                </div>

                {/* Show loading spinner or shipping cost */}
                {isLoading ? (
                  <div className='flex items-center'>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <span>₱{shipping.toFixed(2)}</span>
                )}
              </div>

              {/* Distance information */}
              {distance !== null && !isLoading && (
                <div className='text-xs text-muted-foreground'>
                  Distance: {distance.toFixed(2)} km
                  {shipping === 0 ? " (Free delivery)" : ""}
                </div>
              )}

              {/* Error message */}
              {locationError && (
                <div className='text-xs text-amber-500'>
                  {locationError}
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Total */}
          <div className='flex justify-between font-bold text-base'>
            <span>Total</span>
            <span>₱{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Payment Method</h3>

          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="space-y-2"
          >
            {/* Map through payment options */}
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-2 rounded-md border p-3 ${option.disabled ? 'opacity-60' : ''}`}
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  disabled={option.disabled}
                />
                <Label
                  htmlFor={option.id}
                  className={`flex flex-col w-full ${option.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center">
                    {option.icon}
                    <span>{option.label}</span>

                    {/* Show badge if available */}
                    {option.badge && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Checkout button */}
        <Button
          className='w-full mt-4'
          size="lg"
          disabled={disabled || isLoading || (paymentMethod === PAYMENT_METHODS.ONLINE_PAYMENT)}
          onClick={handleCheckoutClick}
        >
          {/* Show loading text or checkout text */}
          {isLoading && paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Calculating Shipping...
            </>
          ) : (
            'Proceed to Checkout'
          )}
        </Button>

        {/* Terms and conditions */}
        <p className='text-xs text-muted-foreground text-center mt-2'>
          By checking out, you agree to our Terms and Conditions.
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
