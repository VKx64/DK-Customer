"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Package, ShoppingBag, MapPin, Settings, User, Heart, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import ProfileDisplayEdit from '@/components/v1/profile/ProfileDisplayEdit';
import { pb } from '@/lib/pocketbase';
import UserAddresses from '@/components/v1/profile/UserAddresses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ProfilePage = () => {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error("You must be logged in to view this page.");
      router.push('/authentication');
    } else if (user) {
      fetchUserData();
    }
  }, [user, isUserLoading, router]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch addresses
    try {
      const addressRecords = await pb.collection('delivery_information').getFullList({
        filter: `user = '${user.id}'`,
        requestKey: null,
      });
      setAddresses(addressRecords);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      toast.error("Failed to load your addresses.");
      setAddresses([]);
    } finally {
      setIsAddressLoading(false);
    }

    // Fetch orders
    try {
      const orderRecords = await pb.collection('user_order').getFullList({
        filter: `user = '${user.id}'`,
        expand: 'products,address',
        sort: '-created',
        requestKey: null,
      });
      setOrders(orderRecords);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }

    // Fetch service requests
    try {
      const serviceRecords = await pb.collection('service_request').getFullList({
        filter: `user = '${user.id}'`,
        expand: 'assigned_technician',
        sort: '-created',
        requestKey: null,
      });
      setServiceRequests(serviceRecords);
    } catch (error) {
      console.error("Failed to fetch service requests:", error);
      setServiceRequests([]);
    } finally {
      setIsServicesLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Declined': 'bg-red-100 text-red-800',
      'packing': 'bg-blue-100 text-blue-800',
      'ready_for_delivery': 'bg-indigo-100 text-indigo-800',
      'on_the_way': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'ready_for_pickup': 'bg-orange-100 text-orange-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-indigo-100 text-indigo-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'Customer'}!
          </h1>
          <p className="text-gray-600">Manage your profile, orders, and account settings</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isOrdersLoading ? '-' : orders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isOrdersLoading ? '-' : orders.filter(o => o.status === 'Pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Service Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isServicesLoading ? '-' : serviceRequests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Addresses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isAddressLoading ? '-' : addresses.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileDisplayEdit user={user} />

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Created</p>
                    <p className="text-lg">{formatDate(user.created)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-lg">{formatDate(user.updated)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email Status</p>
                    <Badge variant={user.verified ? "default" : "secondary"}>
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Role</p>
                    <Badge variant="outline">
                      {user.role || 'Customer'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">Order #{order.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">
                              Placed on {formatDate(order.created)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              Payment: {order.mode_of_payment}
                            </p>
                            {order.delivery_fee && (
                              <p className="text-sm text-gray-600">
                                Delivery Fee: ₱{order.delivery_fee}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/order?id=${order.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push('/')}
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {isServicesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : serviceRequests.length > 0 ? (
                  <div className="space-y-4">
                    {serviceRequests.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{service.product}</h4>
                            <p className="text-sm text-gray-600">
                              Requested on {formatDate(service.created)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(service.status)}>
                            {service.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{service.problem}</p>
                        {service.scheduled_date && (
                          <p className="text-sm text-blue-600">
                            Scheduled: {formatDate(service.scheduled_date)}
                          </p>
                        )}
                        {service.expand?.assigned_technician && (
                          <p className="text-sm text-green-600">
                            Technician: {service.expand.assigned_technician.name}
                          </p>
                        )}
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/service?id=${service.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No service requests yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push('/service')}
                    >
                      Request Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            {isAddressLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <UserAddresses addresses={addresses} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;