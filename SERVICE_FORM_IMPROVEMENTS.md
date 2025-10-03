# Service Form Improvements

## Overview
Streamlined the service request form to focus exclusively on Daikin air conditioner services. Removed unnecessary device selection step, integrated proper location API, and optimized for air conditioner-specific services.

## Changes Implemented

### 1. ✅ Removed Device Selection Step (Step 1)
- **Change**: Completely removed the device/equipment selection step
- **Reason**: Form is now exclusively for Airconditioner services (Daikin only)
- **Impact**:
  - Reduced from 4 steps to 3 steps
  - Product automatically set to "Airconditioner" by default
  - Simplified user flow - users start directly with location selection
  - Updated form title to "Air Conditioner Service Request"
  - Updated description to mention Daikin air conditioners specifically

### 2. ✅ Default Product to Airconditioner
- **Change**: Set "Airconditioner" as the default product selection
- **Location**: Initial `formData` state (line 64)
### 2. ✅ Default Product to Airconditioner
- **Change**: Set "Airconditioner" as the default and only product
- **Location**: Initial `formData` state (line 64)
- **Impact**: Form automatically operates in Airconditioner mode without user selection

### 3. ✅ PSGC API Integration for Location Selection
- **Change**: Replaced hardcoded city/barangay dropdowns with dynamic PSGC Cloud API
- **Location**: Step 0 (now the first step, was previously step 1)
- **Implementation**:
  - Added new state variables: `regions`, `provinces`, `cities`, `barangays`, `loadingState`
  - Added selection tracking: `selectedRegion`, `selectedProvince`, `selectedCity`
  - Implemented `fetchWithLoading()` helper function
  - Added 4 useEffect hooks for cascading location data:
    1. Load regions on mount
    2. Load provinces when region changes
    3. Load cities when province changes
    4. Load barangays when city changes
  - API endpoints used:
    - `https://psgc.cloud/api/regions`
    - `https://psgc.cloud/api/regions/{code}/provinces`
    - `https://psgc.cloud/api/provinces/{code}/cities-municipalities`
    - `https://psgc.cloud/api/cities-municipalities/{code}/barangays`
    - Fallback: `https://psgc.cloud/api/barangays?city-municipality={code}`
- **Benefits**:
  - Accurate Philippine location data
  - Prevents invalid location entries
  - Same user experience as profile address form
  - Automatic cascading selections

### 4. ✅ Removed "View Pricing" Section
- **Change**: Removed the pricing information panel from step 1 (unit details)
- **Location**: Removed conditional rendering block that appeared on step 2 (now step 1)
  - Reason**: Streamline the form and focus on service request details

### 5. ✅ Brand Restriction to Daikin Only
- **Change**: Limited Airconditioner brand options to only "Daikin"
- **Location**: `deviceBrands.Airconditioner` array (line 48)
- **Before**: `["Daikin", "Carrier", "Panasonic", "LG", "Samsung"]`
- **After**: `["Daikin"]`
- **Reason**: Business focuses on Daikin products

### 6. ✅ Added New AC Types
- **Change**: Added "Dual inverter" and "Inverter" to Airconditioner types
- **Location**: `deviceTypes.Airconditioner` array (line 41)
- **Before**: `["Window", "Split-type", "Cassette", "Portable"]`
- **After**: `["Window", "Split-type", "Cassette", "Portable", "Dual inverter", "Inverter"]`
- **Impact**: Users can now select these modern AC types

## Technical Details

### New Dependencies
- Added `useEffect` and `useCallback` to React imports

### State Management
```javascript
// New location-related states
const [regions, setRegions] = useState([]);
const [provinces, setProvinces] = useState([]);
const [cities, setCities] = useState([]);
const [barangays, setBarangays] = useState([]);
const [loadingState, setLoadingState] = useState({
  regions: false,
  provinces: false,
  cities: false,
  barangays: false,
});
const [selectedRegion, setSelectedRegion] = useState("");
const [selectedProvince, setSelectedProvince] = useState("");
const [selectedCity, setSelectedCity] = useState("");
```

### Form Reset Enhancement
Updated `handleSubmit` to reset location states after successful submission:
```javascript
setSelectedRegion("");
setSelectedProvince("");
setSelectedCity("");
```

## User Experience Improvements

1. **Streamlined Process**: Reduced from 4 steps to 3 steps by removing device selection
2. **Focused Service**: Form clearly indicates it's specifically for air conditioner services
3. **Faster Form Completion**: No need to select device type - immediately start with location
4. **Accurate Locations**: PSGC API ensures valid Philippine addresses
5. **Progressive Disclosure**: Cascading dropdowns guide users through location selection
6. **Loading Indicators**: Users see "Loading..." states while fetching location data
7. **Disabled States**: Dropdowns are disabled until required parent selections are made
8. **Cleaner Interface**: Removed pricing section and device selection simplifies the form
9. **Brand-Specific**: Clear indication that service is for Daikin air conditioners

## Form Structure

### New 3-Step Process:
1. **Location & Property** - Select region, province, city, barangay, and property type
2. **Unit Details** - Choose service type, AC type, brand (Daikin), repair needs, units, and additional requests
3. **Date & Time** - Select preferred service date

### Previous 4-Step Process:
1. ~~Device/Equipment~~ (REMOVED)
2. Location & Property
3. Unit Details
4. Date & Time

## Files Modified
- `/components/v1/service/ServiceForm.jsx` - Main service form component

## Testing Recommendations
1. ~~Test default Airconditioner selection on form load~~ (No longer applicable - step removed)
2. Verify form starts directly with location selection (Step 1 of 3)
3. Verify PSGC API cascading: Region → Province → City → Barangay
4. Confirm only "Daikin" appears in brand dropdown for Airconditioners
5. Check "Dual inverter" and "Inverter" options appear in AC type dropdown
6. Verify pricing section no longer displays on unit details step
7. Test form reset after submission includes location states
8. Test form validation with new location fields and 3-step structure
9. Verify loading states display correctly while fetching location data
10. Test error handling if PSGC API is unavailable
11. Confirm form title shows "Air Conditioner Service Request"
12. Verify step counter shows correct progression (1 of 3, 2 of 3, 3 of 3)

## Notes
- PSGC API provides accurate Philippine Standard Geographic Code data
- Barangay fetching includes fallback endpoint for reliability
- Form maintains backward compatibility with existing `service_city` and `service_barangay` fields
- Location names (not codes) are stored in the database for readability
