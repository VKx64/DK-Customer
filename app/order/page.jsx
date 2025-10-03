"use client";

import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Clock, CheckCircle, XCircle, List } from 'lucide-react';
import OrderCard from '@/components/v1/order/OrderCard';
import OrderStatusTracker from '@/components/v1/order/OrderStatusTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const OrderPage = () => {
  const { user, isUserLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        if (!isUserLoading) {
          setLoading(false);
          setError("Please log in to view your orders");
        }
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching orders for user:", user.id);

        // Get orders with expanded product and address information
        const userOrders = await pb.collection("user_order").getFullList({
          filter: `user = "${user.id}"`,
          expand: "products,address",
          sort: '-created',
          requestKey: null
        });

        console.log("Orders fetched:", userOrders.length);
        const processedOrders = await Promise.all(
          userOrders.map(processOrder)
        );

        setOrders(processedOrders);

        // Set the first order as selected by default if available
        if (processedOrders.length > 0) {
          setSelectedOrder(processedOrders[0]);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(`Failed to load orders: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isUserLoading]);

  const processOrder = async (order) => {
    try {
      // Extract product details
      const productDetails = await Promise.all(
        (order.expand?.products || []).map(async (product) => {
          // Get pricing information for the product
          const pricing = await pb.collection("product_pricing").getFirstListItem(`product_id = "${product.id}"`, {
            requestKey: null
          });

          return {
            id: product.id,
            name: product.product_name || "Unknown Product",
            model: product.product_model || "",
            brand: product.brand || "",
            price: pricing?.final_price || pricing?.base_price || 0,
            image: product.image ?
              pb.files.getUrl(product, product.image) :
              '/Images/sample_product.jpg',
          };
        })
      );

      // Calculate total price
      const totalPrice = productDetails.reduce((sum, product) => sum + product.price, 0);

      // Format address information
      const address = order.expand?.address ? {
        name: order.expand.address.name || "",
        phone: order.expand.address.phone || "",
        fullAddress: order.expand.address.address || "",
        city: order.expand.address.city || "",
        zip: order.expand.address.zip_code || "",
        notes: order.expand.address.additional_notes || ""
      } : null;

      // Get status color
      const statusColors = {
        "Pending": "yellow",
        "Approved": "green",
        "Declined": "destructive",
        "cancelled": "orange"
      };

      return {
        id: order.id,
        date: new Date(order.created).toLocaleDateString("en-US", {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: new Date(order.created).toLocaleTimeString("en-US", {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: order.status || "Pending",
        statusColor: statusColors[order.status] || "yellow",
        paymentMethod: order.mode_of_payment || "Cash On Delivery",
        deliveryFee: order.delivery_fee || 0,
        totalPrice: totalPrice + (order.delivery_fee || 0),
        products: productDetails,
        address: address,
        cancellationReason: order.cancellation_reason || null,
      };
    } catch (error) {
      console.error(`Error processing order ${order.id}:`, error);
      return {
        id: order.id,
        date: new Date(order.created).toLocaleDateString(),
        status: order.status || "Pending",
        paymentMethod: order.mode_of_payment || "Cash On Delivery",
        products: [],
        error: true
      };
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleOrderCancelled = async (orderId) => {
    // Refresh orders after cancellation
    try {
      const userOrders = await pb.collection("user_order").getFullList({
        filter: `user = "${user.id}"`,
        expand: "products,address",
        sort: '-created',
        requestKey: null
      });

      const processedOrders = await Promise.all(
        userOrders.map(processOrder)
      );

      setOrders(processedOrders);

      // Update selected order if it was the one cancelled
      if (selectedOrder?.id === orderId) {
        const updatedOrder = processedOrders.find(o => o.id === orderId);
        setSelectedOrder(updatedOrder || processedOrders[0] || null);
      }
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    switch (activeTab) {
      case 'active':
        // Active orders: not completed, cancelled, or declined
        return orders.filter(order =>
          !['completed', 'cancelled', 'Declined'].includes(order.status)
        );
      case 'completed':
        // Completed orders only
        return orders.filter(order => order.status === 'completed');
      case 'cancelled':
        // Cancelled and declined orders
        return orders.filter(order =>
          ['cancelled', 'Declined'].includes(order.status)
        );
      case 'all':
      default:
        return orders;
    }
  }, [orders, activeTab]);

  // Count orders by category
  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(o => !['completed', 'cancelled', 'Declined'].includes(o.status)).length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => ['cancelled', 'Declined'].includes(o.status)).length,
    };
  }, [orders]);

  // Update selected order when filtered orders change
  useEffect(() => {
    if (filteredOrders.length > 0) {
      // If current selected order is not in filtered list, select first from filtered list
      if (!selectedOrder || !filteredOrders.find(o => o.id === selectedOrder.id)) {
        setSelectedOrder(filteredOrders[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [filteredOrders]);

  if (loading || isUserLoading) {
    return (
      <div className='px-4 md:px-8 lg:px-16 xl:px-96 py-8'>
        <div className='flex flex-col items-center justify-center py-20'>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className='mt-4 text-muted-foreground'>Loading your orders...</p>
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
              Log in to view your orders
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='px-4 md:px-8 lg:px-16 xl:px-96 py-8'>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className='text-xl mt-4 text-muted-foreground'>No orders found</p>
          <Button className='mt-4' onClick={() => window.location.href = '/'}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">All</span>
              <Badge variant="secondary" className="ml-1">{orderCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              <Badge variant="secondary" className="ml-1">{orderCounts.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
              <Badge variant="secondary" className="ml-1">{orderCounts.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelled</span>
              <Badge variant="secondary" className="ml-1">{orderCounts.cancelled}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className='text-center py-12 bg-white rounded-lg shadow-sm'>
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className='text-xl mt-4 text-muted-foreground'>
                  {activeTab === 'active' && 'No active orders'}
                  {activeTab === 'completed' && 'No completed orders'}
                  {activeTab === 'cancelled' && 'No cancelled orders'}
                  {activeTab === 'all' && 'No orders found'}
                </p>
                {activeTab !== 'all' && (
                  <Button
                    className='mt-4'
                    variant="outline"
                    onClick={() => setActiveTab('all')}
                  >
                    View All Orders
                  </Button>
                )}
              </div>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                <div className='lg:col-span-2 space-y-3'>
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className={`cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${selectedOrder?.id === order.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-md'}`}
                    >
                      <OrderCard
                        order={order}
                        onOrderCancelled={handleOrderCancelled}
                        user={user}
                      />
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-1 h-fit sticky top-8">
                  {selectedOrder && (
                    <OrderStatusTracker order={selectedOrder} />
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default OrderPage;