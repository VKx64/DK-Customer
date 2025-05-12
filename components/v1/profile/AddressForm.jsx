"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

// Define the Zod schema for address validation including PSGC fields
const addressSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).max(15).regex(/^\+?[0-9\s-]+$/, { message: "Invalid phone number format." }),
  streetAddress: z.string().min(5, { message: "Street address must be at least 5 characters." }).max(100),
  region: z.string({ required_error: "Region is required." }).min(1, { message: "Region is required." }),
  province: z.string({ required_error: "Province is required." }).min(1, { message: "Province is required." }),
  city_municipality: z.string({ required_error: "City/Municipality is required." }).min(1, { message: "City/Municipality is required." }),
  barangay: z.string({ required_error: "Barangay is required." }).min(1, { message: "Barangay is required." }),
  zip_code: z.string().min(4, { message: "ZIP code must be at least 4 characters." }).max(10),
  additional_notes: z.string().max(200).optional(),
  // Include name fields for easier data handling later, but not strictly validated here
  regionName: z.string().optional(),
  provinceName: z.string().optional(),
  cityName: z.string().optional(),
  barangayName: z.string().optional(),
});

const AddressForm = ({ onSubmit, initialData, isLoading, submitButtonText = "Save Address" }) => {

  // PSGC Location Data State
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Loading states for each dropdown
  const [loadingState, setLoadingState] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false
  });

  const form = useForm({
    resolver: zodResolver(addressSchema),
    // Use initialData if provided (for editing), otherwise default empty strings
    defaultValues: initialData ? {
      name: initialData.name || '',
      phone: initialData.phone || '',
      streetAddress: initialData.streetAddress || '',
      region: initialData.region || '',
      province: initialData.province || '',
      city_municipality: initialData.city_municipality || '',
      barangay: initialData.barangay || '',
      zip_code: initialData.zip_code || '',
      additional_notes: initialData.additional_notes || '',
      regionName: initialData.regionName || '',
      provinceName: initialData.provinceName || '',
      cityName: initialData.cityName || '',
      barangayName: initialData.barangayName || '',
    } : {
      name: '',
      phone: '',
      streetAddress: '',
      region: '',
      province: '',
      city_municipality: '',
      barangay: '',
      zip_code: '',
      additional_notes: '',
      regionName: '',
      provinceName: '',
      cityName: '',
      barangayName: '',
    },
  });

  const { watch, setValue, trigger } = form;

  // Watch for changes in location fields to trigger fetches
  const watchRegion = watch("region");
  const watchProvince = watch("province");
  const watchCity = watch("city_municipality");
  const watchBarangay = watch("barangay");

  // --- PSGC API Fetching Logic --- START ---
  const fetchWithLoading = useCallback(async (url, key) => {
      setLoadingState(prev => ({ ...prev, [key]: true }));
      try {
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
          }
          const data = await response.json();
          return data;
      } catch (error) {
          console.error(`Error fetching ${key}:`, error);
          return []; // Return empty array on error
      } finally {
          setLoadingState(prev => ({ ...prev, [key]: false }));
      }
  }, []);

  // Fetch Regions
  useEffect(() => {
      const loadRegions = async () => {
        if (regions.length === 0) { // Fetch only if not already loaded
          const data = await fetchWithLoading('https://psgc.cloud/api/regions', 'regions');
          setRegions(data);
          // If editing, and region is set, trigger province fetch
          if (initialData?.region && data.length > 0) {
            setValue('region', initialData.region, { shouldValidate: true });
          }
        }
      };
      loadRegions();
  }, [fetchWithLoading, regions.length, initialData, setValue]);

  // Fetch Provinces when region changes
  useEffect(() => {
    const regionCode = watchRegion;
    const shouldFetch = !!regionCode;

    // Clear dependent fields when region changes
    if (regionCode !== initialData?.region || !initialData?.province) { // Clear if region changed OR if initial province doesn't exist
      setValue('province', '', { shouldValidate: false });
      setValue('city_municipality', '', { shouldValidate: false });
      setValue('barangay', '', { shouldValidate: false });
      setValue('provinceName', '', { shouldValidate: false });
      setValue('cityName', '', { shouldValidate: false });
      setValue('barangayName', '', { shouldValidate: false });
      setProvinces([]);
      setCities([]);
      setBarangays([]);
    }

    if (shouldFetch) {
      const loadProvinces = async () => {
        const data = await fetchWithLoading(`https://psgc.cloud/api/regions/${regionCode}/provinces`, 'provinces');
        setProvinces(data);
        // If editing and province exists for this region, set it
        if (initialData?.province && initialData.region === regionCode && data.some(p => p.code === initialData.province)) {
            setValue('province', initialData.province, { shouldValidate: true });
        } else if (regionCode !== initialData?.region) { // Reset if region changed
            setValue('province', '', { shouldValidate: true });
        }
      };
      loadProvinces();
    }
  }, [watchRegion, fetchWithLoading, setValue, initialData]);

  // Fetch Cities when province changes
  useEffect(() => {
    const provinceCode = watchProvince;
    const shouldFetch = !!provinceCode;

    if (provinceCode !== initialData?.province || !initialData?.city_municipality) {
      setValue('city_municipality', '', { shouldValidate: false });
      setValue('barangay', '', { shouldValidate: false });
      setValue('cityName', '', { shouldValidate: false });
      setValue('barangayName', '', { shouldValidate: false });
      setCities([]);
      setBarangays([]);
    }

    if (shouldFetch) {
      const loadCities = async () => {
        const data = await fetchWithLoading(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`, 'cities');
        setCities(data);
        if (initialData?.city_municipality && initialData.province === provinceCode && data.some(c => c.code === initialData.city_municipality)) {
            setValue('city_municipality', initialData.city_municipality, { shouldValidate: true });
        } else if (provinceCode !== initialData?.province) {
            setValue('city_municipality', '', { shouldValidate: true });
        }
      };
      loadCities();
    }
  }, [watchProvince, fetchWithLoading, setValue, initialData]);

  // Fetch Barangays when city changes
  useEffect(() => {
    const cityCode = watchCity;
    const shouldFetch = !!cityCode;

    if (cityCode !== initialData?.city_municipality || !initialData?.barangay) {
        setValue('barangay', '', { shouldValidate: false });
        setValue('barangayName', '', { shouldValidate: false });
        setBarangays([]);
    }

    if (shouldFetch) {
      const loadBarangays = async () => {
        let data = [];
        setLoadingState(prev => ({ ...prev, barangays: true }));
        try {
            // Try direct endpoint first
            const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
            if (!response.ok) throw new Error('Direct fetch failed');
            data = await response.json();
        } catch (error) {
            console.warn("Direct barangay fetch failed, trying alternative...");
            try {
                const altResponse = await fetch(`https://psgc.cloud/api/barangays?city-municipality=${cityCode}`);
                if (!altResponse.ok) throw new Error('Alternative fetch failed');
                data = await altResponse.json();
            } catch (altError) {
                console.error("Error fetching barangays (alternative):", altError);
            }
        } finally {
            setLoadingState(prev => ({ ...prev, barangays: false }));
            setBarangays(data);
             if (initialData?.barangay && initialData.city_municipality === cityCode && data.some(b => b.code === initialData.barangay)) {
                setValue('barangay', initialData.barangay, { shouldValidate: true });
            } else if (cityCode !== initialData?.city_municipality) {
                setValue('barangay', '', { shouldValidate: true });
            }
        }
      };
      loadBarangays();
    }
  }, [watchCity, fetchWithLoading, setValue, initialData]);

 // --- PSGC API Fetching Logic --- END ---

  const handleFormSubmit = (values) => {
     // Find names corresponding to the selected codes before submitting
    const regionName = regions.find(r => r.code === values.region)?.name || '';
    const provinceName = provinces.find(p => p.code === values.province)?.name || '';
    const cityName = cities.find(c => c.code === values.city_municipality)?.name || '';
    const barangayName = barangays.find(b => b.code === values.barangay)?.name || '';

    onSubmit({
      ...values,
      regionName,
      provinceName,
      cityName,
      barangayName,
    });
  };

  // Helper to render Select items
  const renderSelectItems = (items, loading, type) => {
    if (loading) {
      return <SelectItem value="loading" disabled>Loading {type}...</SelectItem>;
    }
    if (!items || items.length === 0) {
      return <SelectItem value="not_found" disabled>No {type} found</SelectItem>;
    }
    return items.map(item => (
      <SelectItem key={item.code} value={item.code}>
        {item.name}
      </SelectItem>
    ));
  };

  return (
    <Form {...form}>
      {/* Keep track of loading state for form submit button */}
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Name and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Dela Cruz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="0917..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Street Address */}
        <FormField
          control={form.control}
          name="streetAddress" // Renamed from 'address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="House No., Street Name, Subdivision" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Region Dropdown */}
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger("region"); // Manually trigger validation
                }}
                value={field.value}
                disabled={loadingState.regions}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {renderSelectItems(regions, loadingState.regions, 'regions')}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Province Dropdown */}
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger("province");
                }}
                value={field.value}
                disabled={!watchRegion || loadingState.provinces}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!watchRegion ? "Select region first" : "Select Province"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {renderSelectItems(provinces, loadingState.provinces, 'provinces')}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City/Municipality Dropdown */}
        <FormField
          control={form.control}
          name="city_municipality" // Updated name
          render={({ field }) => (
            <FormItem>
              <FormLabel>City / Municipality</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger("city_municipality");
                }}
                value={field.value}
                disabled={!watchProvince || loadingState.cities}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!watchProvince ? "Select province first" : "Select City / Municipality"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {renderSelectItems(cities, loadingState.cities, 'cities/municipalities')}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Barangay Dropdown */}
        <FormField
          control={form.control}
          name="barangay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barangay</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  trigger("barangay");
                }}
                value={field.value}
                disabled={!watchCity || loadingState.barangays}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!watchCity ? "Select city/municipality first" : "Select Barangay"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {renderSelectItems(barangays, loadingState.barangays, 'barangays')}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ZIP Code */}
         <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="E.g., gate code, delivery instructions" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Saving...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
};

export default AddressForm;