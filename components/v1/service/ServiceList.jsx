"use client";

import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { Loader2, Calendar, FileText, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

const statusConfig = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    icon: <Clock className="h-4 w-4 mr-1" />,
    label: "Pending"
  },
  scheduled: {
    color: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    icon: <Calendar className="h-4 w-4 mr-1" />,
    label: "Scheduled"
  },
  in_progress: {
    color: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    icon: <ArrowRight className="h-4 w-4 mr-1" />,
    label: "In Progress"
  },
  completed: {
    color: "bg-green-100 text-green-800 hover:bg-green-100",
    icon: <CheckCircle className="h-4 w-4 mr-1" />,
    label: "Completed"
  }
};

const ServiceItem = ({ request }) => {
  const status = request.status || "pending";
  const statusDetails = statusConfig[status] || statusConfig.pending;
  const dateRequested = new Date(request.requested_date);
  const formattedDate = dateRequested.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Get file URL if attachment exists
  const attachmentUrl = request.attachment
    ? pb.files.getUrl(request, request.attachment)
    : null;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center space-x-3">
        {/* Attachment or placeholder icon */}
        <div className="w-10 h-10 relative rounded overflow-hidden bg-muted flex-shrink-0">
          {attachmentUrl && attachmentUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
            <Image
              src={attachmentUrl}
              alt=""
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Request details */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{request.product || "Service Request"}</p>
          <p className="text-xs text-muted-foreground">ID: {request.id.substring(0, 8)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Date */}
        <div className="text-right hidden sm:block">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Status */}
        <Badge className={statusDetails.color}>
          <div className="flex items-center">
            {statusDetails.icon}
            <span className="text-xs">{statusDetails.label}</span>
          </div>
        </Badge>
      </div>
    </div>
  );
};

const ServiceList = ({ user }) => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const results = await pb.collection('service_request').getList(1, 50, {
          filter: `user = "${user.id}"`,
          sort: '-created',
          requestKey: null
        });

        setServiceRequests(results.items);
      } catch (error) {
        console.error("Failed to fetch service requests:", error);
        setError("Could not load your service requests. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40">
        <AlertCircle className="h-5 w-5 text-destructive mr-2" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!serviceRequests.length) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl font-bold">Service List</CardTitle>
          <CardDescription>
            View all your service requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No service requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-2xl font-bold">Service History</CardTitle>
        <CardDescription>
          View all your previous service requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {serviceRequests.map((request) => (
            <ServiceItem key={request.id} request={request} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceList;