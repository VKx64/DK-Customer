"use client";

import React from 'react';
import { CheckCircle, Clock, Truck, Package, Store, AlertTriangle, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Displays order status in a visual progression timeline
 */
const OrderStatusTracker = ({ order }) => {
  if (!order) return null;

  // Define all possible statuses in the order flow
  const allStatuses = [
    {
      key: "Pending",
      label: "Order Pending",
      description: "Your order is being reviewed",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      key: "Approved",
      label: "Order Approved",
      description: "Your payment has been confirmed",
      icon: CheckCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      key: "packing",
      label: "Packing",
      description: "Your items are being packed",
      icon: Package,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      key: "ready_for_pickup",
      label: "Ready for Pickup",
      description: "Your order is ready at our store",
      icon: Store,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      key: "ready_for_delivery",
      label: "Ready for Delivery",
      description: "Your order is prepared for delivery",
      icon: Package,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      key: "on_the_way",
      label: "On The Way",
      description: "Your order is on the way to you",
      icon: Truck,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      key: "completed",
      label: "Completed",
      description: "Your order has been delivered",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      key: "Declined",
      label: "Order Declined",
      description: "Your order could not be processed",
      icon: X,
      iconColor: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  // Determine which flow to use based on order status and payment method
  const isDeclined = order.status === "Declined";
  const isCashOnDelivery = order.paymentMethod === "Cash On Delivery";

  let statusFlow = [];

  if (isDeclined) {
    // Declined flow only shows Pending and Declined
    statusFlow = ["Pending", "Declined"];
  } else if (isCashOnDelivery) {
    // COD flow includes delivery
    statusFlow = [
      "Pending",
      "Approved",
      "packing",
      "ready_for_delivery",
      "on_the_way",
      "completed"
    ];
  } else {
    // In-store pickup flow
    statusFlow = [
      "Pending",
      "Approved",
      "packing",
      "ready_for_pickup",
      "completed"
    ];
  }

  // Find current status in the flow
  let currentStatusIndex = -1;
  let currentStatus = order.status || "Pending";

  if (isDeclined) {
    currentStatusIndex = 1; // Declined is always the last status in the declined flow
  } else {
    // Find the current status index in the flow
    currentStatusIndex = statusFlow.findIndex(status => status === currentStatus);

    // If status not found in flow (should not happen but just in case), default to first valid status
    if (currentStatusIndex === -1) {
      currentStatusIndex = 0;
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4">Order Status</h2>

      <div className="space-y-6 mt-4">
        {isDeclined ? (
          <>
            <div className="flex items-start">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-full bg-red-50 mt-0.5 flex-shrink-0")}>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-medium text-red-700">Order Declined</h3>
                <p className="text-sm text-muted-foreground">
                  Unfortunately, your order has been declined. Please contact our customer service for assistance.
                </p>
              </div>
            </div>

            <div className="border border-red-200 rounded-lg p-4 text-sm bg-red-50">
              <p>Possible reasons for order declination:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Payment verification failed</li>
                <li>Items are out of stock</li>
                <li>Delivery address is outside our coverage area</li>
                <li>Order information was incomplete</li>
              </ul>
              <p className="mt-3 font-medium">
                Please contact us at support@daikin-shop.com for more information.
              </p>
            </div>
          </>
        ) : (
          <div className="relative">
            {statusFlow.map((statusKey, index) => {
              // Find the status details from allStatuses
              const status = allStatuses.find(s => s.key === statusKey) || {};

              // Determine if this status is active, completed, or upcoming
              const isActive = index === currentStatusIndex;
              const isCompleted = index < currentStatusIndex;
              const isUpcoming = index > currentStatusIndex;

              const iconColor = isCompleted ? "text-green-500" :
                              isActive ? status.iconColor :
                              "text-gray-300";

              // Determine the line color for the connector
              const lineColor = index < statusFlow.length - 1 ?
                (index < currentStatusIndex ? "bg-green-500" : "bg-gray-200")
                : "";

              return (
                <div key={statusKey} className="relative">
                  <div className="flex items-start">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 mt-0.5 flex-shrink-0",
                        isCompleted ? "border-green-500 bg-green-50" :
                        isActive ? status.bgColor + " border-" + status.iconColor.split("-")[1] + "-300" :
                        "border-gray-200 bg-white"
                      )}
                    >
                      {React.createElement(status.icon, { className: `h-5 w-5 ${iconColor}` })}
                    </div>
                    <div className="ml-4 pb-8">
                      <h3
                        className={cn(
                          "text-base font-medium leading-none mb-1.5",
                          isActive ? "text-gray-900" :
                          isCompleted ? "text-gray-700" :
                          "text-gray-400"
                        )}
                      >
                        {status.label}
                      </h3>
                      <p
                        className={cn(
                          "text-sm",
                          isActive ? "text-gray-600" :
                          isCompleted ? "text-gray-500" :
                          "text-gray-300"
                        )}
                      >
                        {status.description}
                      </p>

                      {isActive && (
                        <span className="inline-flex items-center mt-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          Current Status
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < statusFlow.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-5 h-full w-0.5",
                        lineColor
                      )}
                      style={{ transform: 'translateX(-50%)', top: "2rem" }}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Separator />
          <div className="mt-4 text-sm text-center">
            <p className="text-muted-foreground">
              Order placed on {order.date} at {order.time}
            </p>
            <p className="mt-1 font-medium">
              Thank you for shopping with Daikin Shop!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusTracker;