"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ProfileDisplayEdit from '@/components/v1/profile/ProfileDisplayEdit';
import { pb } from '@/lib/pocketbase';
import UserAddresses from '@/components/v1/profile/UserAddresses';

const ProfilePage = () => {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error("You must be logged in to view this page.");
      router.push('/authentication');
    } else if (user) {
      const fetchAddresses = async () => {
        setIsAddressLoading(true);
        try {
          const records = await pb.collection('delivery_information').getFullList({
            filter: `user = '${user.id}'`,
          });
          setAddresses(records);
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
          toast.error("Failed to load your addresses.");
          setAddresses([]);
        } finally {
          setIsAddressLoading(false);
        }
      };
      fetchAddresses();
    }
  }, [user, isUserLoading, router]);

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <ProfileDisplayEdit user={user} />
      <div>
        {isAddressLoading ? (
          <div className="flex justify-center items-center py-4"  >
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <UserAddresses addresses={addresses} />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;