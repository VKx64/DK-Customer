"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
import AddressForm from './AddressForm'; // Import the new form
import { pb } from '@/lib/pocketbase'; // Import PocketBase instance
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const UserAddresses = ({ addresses: initialAddresses }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState(initialAddresses || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'

  // Update local state if initialAddresses prop changes
  useEffect(() => {
    setAddresses(initialAddresses || []);
  }, [initialAddresses]);

  const handleOpenForm = (mode = 'add', address = null) => {
    setFormMode(mode);
    // Ensure we pass the full address object including codes AND names if editing
    setSelectedAddress(address);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedAddress(null); // Clear selected address on close
  };

  const handleOpenAlert = (address) => {
    setSelectedAddress(address);
    setIsAlertOpen(true);
  };

  // Updated handleFormSubmit to use the new data structure
  const handleFormSubmit = async (data) => {
    if (!user) {
      toast.error("You must be logged in to manage addresses.");
      return;
    }
    setIsLoading(true);

    // Prepare data based on the new schema (AddressForm now includes the names)
    const payload = {
        user: user.id,
        name: data.name,
        phone: data.phone,
        streetAddress: data.streetAddress,
        region: data.region,
        province: data.province,
        city_municipality: data.city_municipality,
        barangay: data.barangay,
        zip_code: data.zip_code,
        regionName: data.regionName,
        provinceName: data.provinceName,
        cityName: data.cityName,
        barangayName: data.barangayName,
        additional_notes: data.additional_notes || '' // Ensure optional field is handled
    };

    try {
      if (formMode === 'edit' && selectedAddress) {
        const updatedAddress = await pb.collection('delivery_information').update(selectedAddress.id, payload);
        setAddresses(addresses.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr));
        toast.success("Address updated successfully!");
      } else {
        const newAddress = await pb.collection('delivery_information').create(payload);
        setAddresses([...addresses, newAddress]);
        toast.success("Address added successfully!");
      }
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save address:", error);
      // Attempt to parse PocketBase error details
      const pbError = error?.data?.data;
      let errorMsg = "Failed to save address. Please try again.";
      if (pbError) {
         errorMsg = Object.entries(pbError)
            .map(([key, value]) => `${key}: ${value.message}`)
            .join("\n");
      }
      toast.error(errorMsg, { duration: 6000, style: { whiteSpace: 'pre-wrap' } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAddress || !user) return;
    setIsLoading(true);
    try {
      await pb.collection('delivery_information').delete(selectedAddress.id);
      setAddresses(addresses.filter(addr => addr.id !== selectedAddress.id));
      toast.success("Address deleted successfully!");
      setIsAlertOpen(false);
      setSelectedAddress(null);
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error(error.message || "Failed to delete address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format address display
  const formatAddress = (address) => {
      if (!address) return 'N/A';
      const parts = [
        address.streetAddress,
        address.barangayName ? `Brgy. ${address.barangayName}` : null,
        address.cityName,
        address.provinceName,
        // address.regionName, // Optional: Add if needed
        address.zip_code
      ].filter(Boolean); // Filter out null/empty parts
      return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Saved Addresses</h3>
        <Button onClick={() => handleOpenForm('add')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
        </Button>
      </div>

      {/* Dialog for Add/Edit Address Form */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isLoading) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[480px]" onInteractOutside={(e) => {
            if (isLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
            if (isLoading) e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle>{formMode === 'edit' ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {formMode === 'edit' ? 'Update your address details below.' : 'Fill in the details for your address.'}
            </DialogDescription>
          </DialogHeader>
          {/* Pass selectedAddress as initialData only when editing */}
          <AddressForm
            onSubmit={handleFormSubmit}
            initialData={formMode === 'edit' ? selectedAddress : null}
            isLoading={isLoading}
            submitButtonText={formMode === 'edit' ? 'Save Changes' : 'Add Address'}
          />
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{address.name || 'Address'}</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenForm('edit', address)} aria-label="Edit address">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenAlert(address)} className="text-destructive hover:text-destructive/90" aria-label="Delete address">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Phone:</strong> {address.phone || 'N/A'}</p>
                {/* Use the new formatAddress helper */}
                <p><strong>Address:</strong> {formatAddress(address)}</p>
                {/* Display individual parts if needed for debugging or specific UI */}
                {/*
                <p>Street: {address.streetAddress || 'N/A'}</p>
                <p>Barangay: {address.barangayName || 'N/A'}</p>
                <p>City/Mun: {address.cityName || 'N/A'}</p>
                <p>Province: {address.provinceName || 'N/A'}</p>
                <p>ZIP: {address.zip_code || 'N/A'}</p>
                */}
                 {address.additional_notes && (
                  <p className="pt-1 text-xs text-muted-foreground"><strong>Notes:</strong> {address.additional_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500 mb-3">You haven't saved any addresses yet.</p>
          <Button onClick={() => handleOpenForm('add')}>
             <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Address
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserAddresses;