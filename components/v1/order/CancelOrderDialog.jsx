"use client";

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

/**
 * CancelOrderDialog Component
 * Prompts user for cancellation reason and processes order cancellation
 */
const CancelOrderDialog = ({ order, onOrderCancelled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common cancellation reasons
  const commonReasons = [
    "Changed my mind about the purchase",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery time is too long",
    "Need to change delivery address",
    "Product specifications don't meet my needs",
    "Financial reasons",
    "No longer need the product"
  ];

  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setReason(suggestion);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    // Unselect if user manually edits
    if (e.target.value !== selectedSuggestion) {
      setSelectedSuggestion('');
    }
  };

  const handleCancelOrder = async () => {
    // Validate reason
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    try {
      setIsSubmitting(true);

      // Update the order status to cancelled with reason
      await pb.collection('user_order').update(order.id, {
        status: 'cancelled',
        cancellation_reason: reason.trim()
      });

      toast.success('Order cancelled successfully');
      setIsOpen(false);
      setReason('');
      setSelectedSuggestion('');

      // Notify parent component to refresh orders
      if (onOrderCancelled) {
        onOrderCancelled(order.id);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    // Reset state when dialog closes
    if (!open) {
      setReason('');
      setSelectedSuggestion('');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="w-full sm:w-auto"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel order #{order.id.slice(-8)}?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Common reasons (click to select):
            </Label>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((commonReason, index) => (
                <Badge
                  key={index}
                  variant={selectedSuggestion === commonReason ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleSuggestionClick(commonReason)}
                >
                  {commonReason}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="cancellation-reason" className="text-sm font-medium">
              Reason for cancellation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Select a reason above or write your own (minimum 10 characters)..."
              value={reason}
              onChange={handleReasonChange}
              className="mt-2 min-h-[100px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This helps us improve our service
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Keep Order
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderDialog;
