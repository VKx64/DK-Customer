"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ServiceForm from '@/components/v1/service/ServiceForm';
import ServiceList from '@/components/v1/service/ServiceList';
import { toast } from 'sonner';

const ServicePage = () => {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error("Please log in to request service");
      router.push('/authentication');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Request Form - Left Side */}
        <div>
          <ServiceForm user={user} />
        </div>

        {/* Service History - Right Side */}
        <div>
          <ServiceList user={user} />
        </div>
      </div>
    </div>
  );
};

export default ServicePage;