"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Package, Truck, CalendarClock } from 'lucide-react';
import Image from 'next/image';

/**
 * OrderCard Component
 * Displays a single order with expandable details
 */
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  // Toggle expansion state of this order card
  const toggleExpansion = () => {
    setExpanded(prev => !prev);
  };

  // Function to get status icon based on order status
  const getStatusIcon = (status) => {
    switch(status) {
      case "Approved":
        return <Truck className="h-4 w-4" />;
      case "Pending":
        return <CalendarClock className="h-4 w-4" />;
      case "Declined":
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-1.5">
              Order #{order.id.slice(-5)}
            </CardTitle>
            <CardDescription>
              Placed on {order.date} at {order.time}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpansion}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="">
        <div className="flex flex-col sm:flex-row justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Payment Method:</span> {order.paymentMethod}
          </div>
          <div>
            <span className="font-medium">Total:</span> ₱{order.totalPrice.toFixed(2)}
          </div>
        </div>

        {expanded && (
          <div className="mt-3">
            <Separator className="my-3" />
            <h4 className="font-medium mb-2">Items in this order</h4>
            <div className="space-y-2">
              {order.products.map(product => (
                <div key={product.id} className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand} {product.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₱{product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {order.address && order.paymentMethod === 'Cash On Delivery' && (
              <>
                <Separator className="my-3" />
                <h4 className="font-medium mb-2">Shipping Details</h4>
                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                  <p><span className="font-medium">Name:</span> {order.address.name}</p>
                  <p><span className="font-medium">Phone:</span> {order.address.phone}</p>
                  <p><span className="font-medium">Address:</span> {order.address.fullAddress}</p>
                  <p><span className="font-medium">City:</span> {order.address.city} {order.address.zip}</p>
                  {order.address.notes && (
                    <p><span className="font-medium">Notes:</span> {order.address.notes}</p>
                  )}
                </div>
              </>
            )}

            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <div>Subtotal:</div>
              <div>₱{(order.totalPrice - order.deliveryFee).toFixed(2)}</div>
            </div>
            <div className="flex justify-between text-sm">
              <div>Shipping Fee:</div>
              <div>₱{order.deliveryFee.toFixed(2)}</div>
            </div>
            <div className="flex justify-between font-medium mt-2">
              <div>Total:</div>
              <div>₱{order.totalPrice.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!expanded && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={toggleExpansion}
          >
            View Order Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default OrderCard;