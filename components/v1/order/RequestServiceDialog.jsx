"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Wrench, Loader2, Calendar } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

/**
 * RequestServiceDialog Component
 * Allows users to request service for completed orders
 */
const RequestServiceDialog = ({ order, user }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [problem, setProblem] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    // Validation
    if (!problem.trim()) {
      toast.error('Please describe the problem');
      return;
    }

    if (problem.trim().length < 10) {
      toast.error('Please provide more details (at least 10 characters)');
      return;
    }

    if (!requestedDate) {
      toast.error('Please select a preferred service date');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create service request for each product in the order
      const serviceRequests = await Promise.all(
        order.products.map(async (product) => {
          return await pb.collection('service_request').create({
            user: user.id,
            product: `${product.brand} ${product.name} ${product.model}`.trim(),
            problem: problem.trim(),
            status: 'pending',
            requested_date: requestedDate,
            remarks: `Service request from order #${order.id.slice(-8)}`
          });
        })
      );

      toast.success(
        `Service request${serviceRequests.length > 1 ? 's' : ''} created successfully`,
        {
          description: 'Our team will contact you shortly'
        }
      );

      setIsOpen(false);
      setProblem('');
      setRequestedDate('');

      // Optionally navigate to service page after a delay
      setTimeout(() => {
        router.push('/service');
      }, 1500);

    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error('Failed to create service request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    // Reset form when dialog closes
    if (!open) {
      setProblem('');
      setRequestedDate('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Request Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Service</DialogTitle>
          <DialogDescription>
            Request service for products from order #{order.id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Products */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Products from this order:
            </Label>
            <div className="space-y-2">
              {order.products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand} {product.model}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {index === 0 && order.products.length > 1
                      ? `+${order.products.length - 1} more`
                      : ''}
                  </Badge>
                </div>
              ))}
            </div>
            {order.products.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Service requests will be created for all products
              </p>
            )}
          </div>

          {/* Problem Description */}
          <div>
            <Label htmlFor="problem" className="text-sm font-medium">
              Describe the problem <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="problem"
              placeholder="Please describe the issue you're experiencing (minimum 10 characters)..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="mt-2 min-h-[100px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Be as specific as possible to help our technicians
            </p>
          </div>

          {/* Preferred Date */}
          <div>
            <Label htmlFor="requested_date" className="text-sm font-medium">
              Preferred Service Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="requested_date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={today}
                disabled={isSubmitting}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This is a preferred date. Actual scheduling may vary based on technician availability.
            </p>
          </div>

          {/* Order Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> A service request will be created and our team will contact you
              at the delivery address provided in this order or via your registered contact information.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !problem.trim() || !requestedDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestServiceDialog;
