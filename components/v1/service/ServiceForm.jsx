"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AirVent, Home, Monitor, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";

const steps = [
  "Location & Property",
  "Unit Details",
  "Date & Time",
];

const unitDetails = [
  "REPAIR",
  "CLEANING",
  "INSTALLATION",
  "SITE SURVEY",
  "RELOCATION",
  "DISMANTLING",
];

const propertyTypes = ["Residential", "Commercial", "Industrial"];

const deviceTypes = {
  Airconditioner: ["Window", "Split-type", "Cassette", "Portable", "Dual inverter", "Inverter"],
  Appliance: ["Refrigerator", "Washing Machine", "Microwave", "Oven"],
  Computer: ["Desktop", "Laptop", "All-in-One"],
  "Flatscreen TV": ["LED", "OLED", "QLED", "Plasma", "LCD"],
};

const deviceBrands = {
  Airconditioner: ["Daikin"],
  Appliance: ["Daikin", "LG", "Samsung", "Whirlpool", "Panasonic"],
  Computer: ["Acer", "Asus", "Dell", "HP", "Lenovo"],
  "Flatscreen TV": ["Sony", "Samsung", "LG", "TCL", "Panasonic"],
};

const additionalRequestOptions = [
  "Long ladder needed for unit located above 10ft/3m (+Php 350)",
  "Free on re-charge may be needed (additional charge applies)",
];

const ServiceForm = ({ user }) => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product: "Airconditioner",
    service_city: "",
    service_barangay: "",
    property_type: "",
    unit_detail: "",
    device_type: "",
    brand: "",
    may_need_repair: "",
    problem: "",
    attachment: null,
    requested_date: "",
    remarks: "",
    status: "pending",
    units: 1,
    additional_requests: [],
  });
  const [previewUrl, setPreviewUrl] = useState("");

  // PSGC API State
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

  const today = new Date().toISOString().split("T")[0];

  // --- PSGC API Fetching Logic --- START ---
  const fetchWithLoading = useCallback(async (url, type) => {
    setLoadingState((prev) => ({ ...prev, [type]: true }));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${type}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`Failed to load ${type}`);
      return [];
    } finally {
      setLoadingState((prev) => ({ ...prev, [type]: false }));
    }
  }, []);

  // Fetch Regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      const data = await fetchWithLoading("https://psgc.cloud/api/regions", "regions");
      setRegions(data);
    };
    loadRegions();
  }, [fetchWithLoading]);

  // Fetch Provinces when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setSelectedProvince("");
      setSelectedCity("");
      setFormData((prev) => ({ ...prev, service_city: "", service_barangay: "" }));
      return;
    }

    const loadProvinces = async () => {
      const data = await fetchWithLoading(
        `https://psgc.cloud/api/regions/${selectedRegion}/provinces`,
        "provinces"
      );
      setProvinces(data);
      setCities([]);
      setBarangays([]);
      setSelectedProvince("");
      setSelectedCity("");
      setFormData((prev) => ({ ...prev, service_city: "", service_barangay: "" }));
    };
    loadProvinces();
  }, [selectedRegion, fetchWithLoading]);

  // Fetch Cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setBarangays([]);
      setSelectedCity("");
      setFormData((prev) => ({ ...prev, service_city: "", service_barangay: "" }));
      return;
    }

    const loadCities = async () => {
      const data = await fetchWithLoading(
        `https://psgc.cloud/api/provinces/${selectedProvince}/cities-municipalities`,
        "cities"
      );
      setCities(data);
      setBarangays([]);
      setSelectedCity("");
      setFormData((prev) => ({ ...prev, service_city: "", service_barangay: "" }));
    };
    loadCities();
  }, [selectedProvince, fetchWithLoading]);

  // Fetch Barangays when city changes
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      setFormData((prev) => ({ ...prev, service_barangay: "" }));
      return;
    }

    const loadBarangays = async () => {
      setLoadingState((prev) => ({ ...prev, barangays: true }));
      try {
        let data = [];
        try {
          const response = await fetch(
            `https://psgc.cloud/api/cities-municipalities/${selectedCity}/barangays`
          );
          if (!response.ok) throw new Error("Direct fetch failed");
          data = await response.json();
        } catch (error) {
          console.warn("Direct barangay fetch failed, trying alternative...");
          const altResponse = await fetch(
            `https://psgc.cloud/api/barangays?city-municipality=${selectedCity}`
          );
          if (!altResponse.ok) throw new Error("Alternative fetch failed");
          data = await altResponse.json();
        }
        setBarangays(data);
        setFormData((prev) => ({ ...prev, service_barangay: "" }));
      } catch (error) {
        console.error("Error fetching barangays:", error);
        toast.error("Failed to load barangays");
        setBarangays([]);
      } finally {
        setLoadingState((prev) => ({ ...prev, barangays: false }));
      }
    };
    loadBarangays();
  }, [selectedCity]);
  // --- PSGC API Fetching Logic --- END ---

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 5 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG or PDF file");
      return;
    }
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setFormData((prev) => ({ ...prev, attachment: file }));
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  };

  const handleNext = () => {
    // Add validation per step if needed
    if (
      step === 0 &&
      (!formData.service_city ||
        !formData.service_barangay ||
        !formData.property_type)
    ) {
      toast.error("Please complete all location and property fields");
      return;
    }
    if (step === 1) {
      if (!formData.unit_detail) {
        toast.error("Please select a unit detail");
        return;
      }
      if (!formData.device_type) {
        toast.error("Please select an appliance type");
        return;
      }
      if (!formData.may_need_repair) {
        toast.error("Please select if the unit may need repair");
        return;
      }
    }
    // In handleNext, add validation for step 2
    if (step === 2 && !formData.requested_date) {
      toast.error("Please select a date for the service");
      return;
    }
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to request service");
      router.push("/authentication");
      return;
    }
    if (!formData.product) {
      toast.error("Please fill in all required fields");
      return;
    }
    // Require date on last step
    if (step === steps.length - 1 && !formData.requested_date) {
      toast.error("Please select a date for the service");
      return;
    }
    try {
      setIsSubmitting(true);
      const formDataObj = new FormData();
      formDataObj.append("user", user.id);
      Object.keys(formData).forEach((key) => {
        if (key === "attachment" && formData.attachment) {
          formDataObj.append("attachment", formData.attachment);
        } else if (key !== "attachment") {
          formDataObj.append(key, formData[key]);
        }
      });
      await pb.collection("service_request").create(formDataObj);
      toast.success("Service request submitted successfully!");
      setFormData({
        product: "Airconditioner",
        service_city: "",
        service_barangay: "",
        property_type: "",
        unit_detail: "",
        device_type: "",
        brand: "",
        may_need_repair: "",
        problem: "",
        attachment: null,
        requested_date: "",
        remarks: "",
        status: "pending",
        units: 1,
        additional_requests: [],
      });
      setPreviewUrl("");
      setSelectedRegion("");
      setSelectedProvince("");
      setSelectedCity("");
      setStep(0);
    } catch (error) {
      toast.error(error.message || "Failed to submit service request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnitChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      units: Math.max(1, prev.units + delta),
    }));
  };

  const handleAddRequest = (option) => {
    setFormData((prev) => ({
      ...prev,
      additional_requests: prev.additional_requests.includes(option)
        ? prev.additional_requests.filter((o) => o !== option)
        : [...prev.additional_requests, option],
    }));
  };

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region" className="text-base font-medium">
                Region <span className="text-destructive">*</span>
              </Label>
              <select
                id="region"
                name="region"
                className="w-full border rounded-md px-3 py-2"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                required
                disabled={loadingState.regions}
              >
                <option value="">
                  {loadingState.regions ? "Loading regions..." : "Select Region"}
                </option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="province" className="text-base font-medium">
                Province <span className="text-destructive">*</span>
              </Label>
              <select
                id="province"
                name="province"
                className="w-full border rounded-md px-3 py-2"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                required
                disabled={!selectedRegion || loadingState.provinces}
              >
                <option value="">
                  {loadingState.provinces
                    ? "Loading provinces..."
                    : selectedRegion
                    ? "Select Province"
                    : "Select a region first"}
                </option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_city" className="text-base font-medium">
                City/Municipality <span className="text-destructive">*</span>
              </Label>
              <select
                id="service_city"
                name="service_city"
                className="w-full border rounded-md px-3 py-2"
                value={selectedCity}
                onChange={(e) => {
                  const cityCode = e.target.value;
                  const cityName = cities.find((c) => c.code === cityCode)?.name || "";
                  setSelectedCity(cityCode);
                  setFormData((prev) => ({ ...prev, service_city: cityName }));
                }}
                required
                disabled={!selectedProvince || loadingState.cities}
              >
                <option value="">
                  {loadingState.cities
                    ? "Loading cities..."
                    : selectedProvince
                    ? "Select City/Municipality"
                    : "Select a province first"}
                </option>
                {cities.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_barangay" className="text-base font-medium">
                Barangay <span className="text-destructive">*</span>
              </Label>
              <select
                id="service_barangay"
                name="service_barangay"
                className="w-full border rounded-md px-3 py-2"
                value={formData.service_barangay || ""}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, service_barangay: e.target.value }));
                }}
                required
                disabled={!selectedCity || loadingState.barangays}
              >
                <option value="">
                  {loadingState.barangays
                    ? "Loading barangays..."
                    : selectedCity
                    ? "Select Barangay"
                    : "Select a city first"}
                </option>
                {barangays.map((barangay) => (
                  <option key={barangay.code} value={barangay.name}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property_type" className="text-base font-medium">
                Property Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="property_type"
                name="property_type"
                className="w-full border rounded-md px-3 py-2"
                value={formData.property_type || ""}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Property Type</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">
                Unit Details <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Which service do you need
              </p>
              <div className="grid grid-cols-3 gap-4">
                {unitDetails.map((label) => (
                  <button
                    type="button"
                    key={label}
                    className={`flex items-center justify-center border rounded-md py-6 px-2 text-base font-semibold transition ${
                      formData.unit_detail === label
                        ? "border-primary bg-primary/10"
                        : "border-muted bg-background"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        unit_detail: label,
                        device_type: "",
                        brand: "",
                        may_need_repair: "",
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Only show device-specific fields if a unit_detail is selected */}
            {formData.unit_detail && (
              <div className="space-y-4">
                <p className="font-medium">
                  Provide the details of the{" "}
                  {formData.product?.replace("Daikin ", "")?.toLowerCase()} that
                  needs {formData.unit_detail.toLowerCase()}.
                  <br />
                  We service all brands.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border">
                  {/* Device Type Dropdown */}
                  <div>
                    <Label htmlFor="device_type" className="font-semibold">
                      {formData.product?.replace("Daikin ", "") || "Device"}{" "}
                      Type
                      <span style={{ color: "red", marginLeft: 2 }}>*</span>
                    </Label>
                    <select
                      id="device_type"
                      name="device_type"
                      className="w-full border rounded-md px-3 py-2 mt-1"
                      value={formData.device_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select...</option>
                      {(deviceTypes[formData.product] || []).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Brand Dropdown */}
                  <div>
                    <Label htmlFor="brand" className="font-semibold">
                      Brand
                    </Label>
                    <select
                      id="brand"
                      name="brand"
                      className="w-full border rounded-md px-3 py-2 mt-1"
                      value={formData.brand}
                      onChange={handleInputChange}
                    >
                      <option value="">Select...</option>
                      {(deviceBrands[formData.product] || []).map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* May Need Repair */}
                  <div className="col-span-2">
                    <Label className="font-semibold">
                      May need repair?
                      <span style={{ color: "red", marginLeft: 2 }}>*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        className={`flex-1 border rounded-md py-2 font-medium ${
                          formData.may_need_repair === "No"
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-background"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            may_need_repair: "No",
                          }))
                        }
                      >
                        No
                      </button>
                      <button
                        type="button"
                        className={`flex-1 border rounded-md py-2 font-medium ${
                          formData.may_need_repair === "Yes"
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-background"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            may_need_repair: "Yes",
                          }))
                        }
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>

                {/* No. of units */}
                <div>
                  <Label className="font-semibold">No. of units</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnitChange(-1)}
                      disabled={formData.units <= 1}
                    >
                      –
                    </Button>
                    <span className="w-8 text-center">{formData.units}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnitChange(1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Additional Requests */}
                <div className="space-y-2 mt-4">
                  <Label className="text-base font-medium">
                    Additional Requests
                  </Label>
                  <div className="flex flex-col gap-2">
                    {additionalRequestOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`flex items-center justify-between border rounded-md py-3 px-4 text-sm font-medium transition ${
                          formData.additional_requests.includes(option)
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-background"
                        }`}
                        onClick={() => handleAddRequest(option)}
                      >
                        <span>{option}</span>
                        {formData.additional_requests.includes(option) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        // Generate next 7 days for selection
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return {
            date,
            label: date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            day: date.toLocaleDateString("en-US", { weekday: "short" }),
            isTomorrow: i === 1,
          };
        });
        return (
          <div>
            <div className="mb-4">
              <span className="block text-lg font-semibold mb-2">
                When do you need the service?
                <span
                  className="text-destructive"
                  style={{ color: "red", marginLeft: 4 }}
                >
                  *
                </span>
              </span>
              <div className="flex gap-2">
                {days.map((d, idx) => (
                  <button
                    key={d.date}
                    type="button"
                    className={`flex flex-col items-center border rounded-md px-4 py-2 ${
                      formData.requested_date ===
                      d.date.toISOString().split("T")[0]
                        ? "border-primary bg-primary/10"
                        : "border-muted bg-background"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        requested_date: d.date.toISOString().split("T")[0],
                      }))
                    }
                  >
                    <span className="font-bold">{d.label}</span>
                    <span className="text-xs">{d.day}</span>
                    {d.isTomorrow && (
                      <span className="text-xs text-muted-foreground">
                        Tomorrow
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* You can add time selection here if needed */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-2xl font-bold">
          Air Conditioner Service Request
        </CardTitle>
        <CardDescription>
          Request repair, maintenance, installation or consultation for your Daikin air conditioner
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          {/* Stepper */}
          <div className="flex items-center mb-6">
            {steps.map((label, idx) => (
              <React.Fragment key={label}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    step === idx
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-1 bg-muted mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Step Content */}
          <div className="mb-6">{renderStep()}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || !formData.requested_date}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;
