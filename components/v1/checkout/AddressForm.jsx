"use client";

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { pb } from '@/lib/pocketbase';
import { Loader2 } from 'lucide-react';

const AddressForm = ({ userId, onAddressChange, initialAddressId = null }) => {
  // Saved addresses state
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddressId || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // Philippine location data state
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

  // New address form state
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    streetAddress: '',
    region: '',
    regionName: '',
    province: '',
    provinceName: '',
    city: '',
    cityName: '',
    barangay: '',
    barangayName: '',
    zip_code: '',
    additional_notes: ''
  });

  // Memoized function to update parent component only when needed
  const updateParent = useCallback((addressData) => {
    // Only update parent when we have minimum required fields
    if (addressData && addressData.name && addressData.phone) {
      onAddressChange({
        ...addressData,
        isNew: true,
        address: constructFullAddress(addressData)
      });
    }
  }, [onAddressChange]);

  // Debounced update - will only call updateParent after a delay
  const debouncedUpdate = useCallback(
    (() => {
      let timeout;
      return (data) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => updateParent(data), 300);
      };
    })(),
    [updateParent]
  );

  // Fetch regions from PSGC API - only once when component mounts
  useEffect(() => {
    const fetchRegions = async () => {
      if (regions.length > 0) return;

      try {
        setLoadingState(prev => ({ ...prev, regions: true }));
        const response = await fetch('https://psgc.cloud/api/regions');
        const data = await response.json();
        setRegions(data);
      } catch (error) {
        console.error("Error fetching regions:", error);
      } finally {
        setLoadingState(prev => ({ ...prev, regions: false }));
      }
    };

    fetchRegions();
  }, [regions.length]);

  // Fetch provinces by region when region changes
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!newAddress.region) {
        setProvinces([]);
        return;
      }

      try {
        setLoadingState(prev => ({ ...prev, provinces: true }));
        const response = await fetch(`https://psgc.cloud/api/regions/${newAddress.region}/provinces`);
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Error fetching provinces:", error);
        setProvinces([]);
      } finally {
        setLoadingState(prev => ({ ...prev, provinces: false }));
      }
    };

    // Reset dependent fields when region changes
    if (newAddress.region) {
      setNewAddress(prev => ({
        ...prev,
        province: '',
        provinceName: '',
        city: '',
        cityName: '',
        barangay: '',
        barangayName: ''
      }));

      setCities([]);
      setBarangays([]);

      fetchProvinces();
    }
  }, [newAddress.region]);

  // Fetch cities by province when province changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!newAddress.province) {
        setCities([]);
        return;
      }

      try {
        setLoadingState(prev => ({ ...prev, cities: true }));
        const response = await fetch(`https://psgc.cloud/api/provinces/${newAddress.province}/cities-municipalities`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      } finally {
        setLoadingState(prev => ({ ...prev, cities: false }));
      }
    };

    // Reset dependent fields when province changes
    if (newAddress.province) {
      setNewAddress(prev => ({
        ...prev,
        city: '',
        cityName: '',
        barangay: '',
        barangayName: ''
      }));

      setBarangays([]);

      fetchCities();
    }
  }, [newAddress.province]);

  // Fetch barangays by city when city changes
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!newAddress.city) {
        setBarangays([]);
        return;
      }

      try {
        setLoadingState(prev => ({ ...prev, barangays: true }));

        try {
          // First try the direct city-municipality endpoint
          const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${newAddress.city}/barangays`);

          if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
          }

          const data = await response.json();
          setBarangays(data);
        } catch (error) {
          console.error(`First barangay fetch attempt failed: ${error.message}`);

          try {
            // Try the query parameter approach as fallback
            const altResponse = await fetch(`https://psgc.cloud/api/barangays?city-municipality=${newAddress.city}`);

            if (!altResponse.ok) {
              throw new Error(`Alternative API returned ${altResponse.status}`);
            }

            const altData = await altResponse.json();
            setBarangays(altData);
          } catch (altError) {
            console.error(`Alternative barangay fetch failed: ${altError.message}`);
            setBarangays([]);
          }
        }
      } finally {
        setLoadingState(prev => ({ ...prev, barangays: false }));
      }
    };

    // Reset barangay when city changes
    if (newAddress.city) {
      setNewAddress(prev => ({
        ...prev,
        barangay: '',
        barangayName: ''
      }));

      fetchBarangays();
    }
  }, [newAddress.city]);

  // Fetch user's saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) {
        console.warn("AddressForm: No userId provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        try {
          const addressResult = await pb.collection('delivery_information').getList(1, 50, {
            filter: `user = "${userId}"`,
            requestKey: null
          });

          setAddresses(addressResult?.items || []);

          if (addressResult?.items?.length > 0 && !selectedAddressId) {
            setSelectedAddressId(addressResult.items[0].id);
            onAddressChange(addressResult.items[0]);
          }
        } catch (pbError) {
          console.error("Failed to fetch addresses from PocketBase:", pbError);
          setAddresses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId, onAddressChange, selectedAddressId]);

  // Handle address selection change
  const handleAddressSelect = (value) => {
    setSelectedAddressId(value);

    if (value === 'add_new') {
      setShowAddForm(true);
      onAddressChange(null);
    } else {
      setShowAddForm(false);
      const selectedAddress = addresses.find(addr => addr.id === value);
      if (selectedAddress) {
        onAddressChange(selectedAddress);
      }
    }
  };

  // Handle input changes for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));

    debouncedUpdate({
      ...newAddress,
      [name]: value
    });
  };

  // Handle region selection
  const handleRegionChange = (value) => {
    const selectedRegion = regions.find(r => r.code === value);
    const regionName = selectedRegion?.name || '';

    setNewAddress(prev => ({
      ...prev,
      region: value,
      regionName
    }));

    debouncedUpdate({
      ...newAddress,
      region: value,
      regionName,
      province: '',
      provinceName: '',
      city: '',
      cityName: '',
      barangay: '',
      barangayName: ''
    });
  };

  // Handle province selection
  const handleProvinceChange = (value) => {
    const selectedProvince = provinces.find(p => p.code === value);
    const provinceName = selectedProvince?.name || '';

    setNewAddress(prev => ({
      ...prev,
      province: value,
      provinceName
    }));

    debouncedUpdate({
      ...newAddress,
      province: value,
      provinceName,
      city: '',
      cityName: '',
      barangay: '',
      barangayName: ''
    });
  };

  // Handle city selection
  const handleCityChange = (value) => {
    const selectedCity = cities.find(c => c.code === value);
    const cityName = selectedCity?.name || '';

    setNewAddress(prev => ({
      ...prev,
      city: value,
      cityName
    }));

    debouncedUpdate({
      ...newAddress,
      city: value,
      cityName,
      barangay: '',
      barangayName: ''
    });
  };

  // Handle barangay selection
  const handleBarangayChange = (value) => {
    const selectedBarangay = barangays.find(b => b.code === value);
    const barangayName = selectedBarangay?.name || '';

    setNewAddress(prev => ({
      ...prev,
      barangay: value,
      barangayName
    }));

    debouncedUpdate({
      ...newAddress,
      barangay: value,
      barangayName
    });
  };

  // Construct full address from parts
  const constructFullAddress = (addressData) => {
    const parts = [
      addressData.streetAddress,
      addressData.barangayName && `Brgy. ${addressData.barangayName}`,
      addressData.cityName,
      addressData.provinceName,
      addressData.regionName
    ].filter(Boolean);

    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="addressSelect" className="text-sm font-medium">Shipping Address</Label>
        <Select
          value={selectedAddressId}
          onValueChange={handleAddressSelect}
        >
          <SelectTrigger id="addressSelect" className="w-full h-auto min-h-[48px] py-3">
            <SelectValue placeholder="Select shipping address">
              {selectedAddressId && selectedAddressId !== 'add_new' && (
                <div className="text-left w-full">
                  <div className="font-medium text-sm truncate">
                    {addresses.find(addr => addr.id === selectedAddressId)?.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {addresses.find(addr => addr.id === selectedAddressId)?.address}
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-full max-w-none min-w-[var(--radix-select-trigger-width)]">
            {addresses.map(address => (
              <SelectItem key={address.id} value={address.id} className="py-3 px-3">
                <div className="space-y-1 text-left w-full">
                  <div className="font-medium text-sm">{address.name}</div>
                  <div className="text-xs text-muted-foreground break-words overflow-hidden">
                    {address.address.length > 80
                      ? `${address.address.substring(0, 80)}...`
                      : address.address
                    }
                  </div>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="add_new" className="py-3 px-3 border-t">
              <div className="flex items-center space-x-2 w-full">
                <span className="text-primary">+</span>
                <span className="font-medium">Add New Address</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Address Form */}
      {showAddForm && (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">New Shipping Address</h3>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newAddress.name}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newAddress.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  value={newAddress.streetAddress}
                  onChange={handleInputChange}
                  placeholder="House/Lot/Unit Number, Street Name"
                  required
                />
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={newAddress.region}
                  onValueChange={handleRegionChange}
                  disabled={loadingState.regions}
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingState.regions ? (
                      <SelectItem value="loading" disabled>Loading regions...</SelectItem>
                    ) : regions.length === 0 ? (
                      <SelectItem value="not_found" disabled>No regions found</SelectItem>
                    ) : (
                      regions.map(region => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loadingState.regions && (
                  <div className="flex items-center pt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Loading regions...</span>
                  </div>
                )}
              </div>

              {/* Province */}
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={newAddress.province}
                  onValueChange={handleProvinceChange}
                  disabled={!newAddress.region || loadingState.provinces}
                >
                  <SelectTrigger id="province">
                    <SelectValue placeholder={!newAddress.region ? "Select region first" : "Select province"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingState.provinces ? (
                      <SelectItem value="loading" disabled>Loading provinces...</SelectItem>
                    ) : provinces.length === 0 ? (
                      <SelectItem value="not_found" disabled>No provinces found</SelectItem>
                    ) : (
                      provinces.map(province => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loadingState.provinces && (
                  <div className="flex items-center pt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Loading provinces...</span>
                  </div>
                )}
              </div>

              {/* City/Municipality */}
              <div className="space-y-2">
                <Label htmlFor="city">City/Municipality</Label>
                <Select
                  value={newAddress.city}
                  onValueChange={handleCityChange}
                  disabled={!newAddress.province || loadingState.cities}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={!newAddress.province ? "Select province first" : "Select city/municipality"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingState.cities ? (
                      <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                    ) : cities.length === 0 ? (
                      <SelectItem value="not_found" disabled>No cities found</SelectItem>
                    ) : (
                      cities.map(city => (
                        <SelectItem key={city.code} value={city.code}>
                          {city.name} {city.cityClass ? '(City)' : '(Municipality)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loadingState.cities && (
                  <div className="flex items-center pt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Loading cities/municipalities...</span>
                  </div>
                )}
              </div>

              {/* Barangay */}
              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay</Label>
                <Select
                  value={newAddress.barangay}
                  onValueChange={handleBarangayChange}
                  disabled={!newAddress.city || loadingState.barangays}
                >
                  <SelectTrigger id="barangay">
                    <SelectValue placeholder={!newAddress.city ? "Select city/municipality first" : "Select barangay"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingState.barangays ? (
                      <SelectItem value="loading" disabled>Loading barangays...</SelectItem>
                    ) : barangays.length === 0 ? (
                      <SelectItem value="not_found" disabled>No barangays found</SelectItem>
                    ) : (
                      barangays.map(barangay => (
                        <SelectItem key={barangay.code} value={barangay.code}>
                          {barangay.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {loadingState.barangays && (
                  <div className="flex items-center pt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Loading barangays...</span>
                  </div>
                )}
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={newAddress.zip_code}
                  onChange={handleInputChange}
                  placeholder="ZIP Code"
                  required
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additional_notes"
                  name="additional_notes"
                  value={newAddress.additional_notes}
                  onChange={handleInputChange}
                  placeholder="Delivery instructions, landmark, etc."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display selected address details when an existing address is selected */}
      {selectedAddressId && selectedAddressId !== 'add_new' && (
        <div className="w-full p-4 bg-background border border-border rounded-lg shadow-sm">
          <div className="space-y-3 w-full">
            <div className="flex items-center space-x-2 w-full">
              <span className="text-primary">👤</span>
              <span className="font-semibold text-sm flex-1">{addresses.find(addr => addr.id === selectedAddressId)?.name}</span>
            </div>
            <div className="flex items-start space-x-2 w-full">
              <span className="text-muted-foreground mt-0.5">📍</span>
              <div className="text-sm text-muted-foreground space-y-1 flex-1 min-w-0 w-full">
                <p className="break-words leading-relaxed w-full">{addresses.find(addr => addr.id === selectedAddressId)?.address}</p>
                <p className="break-words w-full">{addresses.find(addr => addr.id === selectedAddressId)?.city}, {addresses.find(addr => addr.id === selectedAddressId)?.zip_code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full">
              <span className="text-muted-foreground">📱</span>
              <span className="text-sm text-muted-foreground break-all flex-1">{addresses.find(addr => addr.id === selectedAddressId)?.phone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
