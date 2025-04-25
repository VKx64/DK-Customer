"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { pb } from '@/lib/pocketbase';

const ServiceForm = ({ user }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    problem: '',
    requested_date: '',
    remarks: '',
    status: 'pending'
  });
  const [attachment, setAttachment] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG or PDF file");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setAttachment(file);

    // Create preview URL for images
    if (file.type.startsWith('image/')) {
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    } else {
      setPreviewUrl('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to request service");
      router.push('/authentication');
      return;
    }

    // Validate required fields
    if (!formData.product || !formData.problem || !formData.requested_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create FormData object for file upload
      const formDataObj = new FormData();

      // Add user ID
      formDataObj.append('user', user.id);

      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });

      // Add attachment if exists
      if (attachment) {
        formDataObj.append('attachment', attachment);
      }

      // Submit to PocketBase
      const record = await pb.collection('service_request').create(formDataObj);

      toast.success("Service request submitted successfully!");

      // Reset form
      setFormData({
        product: '',
        problem: '',
        requested_date: '',
        remarks: '',
        status: 'pending'
      });
      setAttachment(null);
      setPreviewUrl('');

    } catch (error) {
      console.error("Error submitting service request:", error);
      toast.error(error.message || "Failed to submit service request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-2xl font-bold">Electronic Service Request</CardTitle>
        <CardDescription>
          Request repair, maintenance or consultation for your electronic equipment
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Product Information */}
            <div className="space-y-2">
              <Label htmlFor="product" className="text-base font-medium">
                Device/Equipment <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product"
                name="product"
                placeholder="Enter your device model and brand (e.g., Daikin AC Split Type Inverter FTKM10)"
                value={formData.product}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <Label htmlFor="problem" className="text-base font-medium">
                Description of Problem <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="problem"
                name="problem"
                placeholder="Please describe the issue you're experiencing in detail"
                value={formData.problem}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            {/* Attachment Upload */}
            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-base font-medium">
                Attachment
              </Label>
              <div className="mt-1 flex items-center">
                <Input
                  id="attachment"
                  name="attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload photos of the issue or relevant documents (JPEG, PNG, PDF, max 5MB)
              </p>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Preview:</p>
                  <img
                    src={previewUrl}
                    alt="Attachment Preview"
                    className="max-h-40 rounded-md border"
                  />
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Service Schedule */}
            <div className="space-y-2">
              <Label htmlFor="requested_date" className="text-base font-medium">
                Preferred Service Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="requested_date"
                name="requested_date"
                type="date"
                min={today}
                value={formData.requested_date}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-base font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="remarks"
                name="remarks"
                placeholder="Any additional information or special instructions"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={2}
              />
            </div>
          </div>

          <CardFooter className="flex justify-between items-center pt-6 pb-0 px-0">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;