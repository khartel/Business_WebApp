import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { businessService } from "../../services/business.service";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

export default function CreateBusinessForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Fetch countries
  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: businessService.getCountries,
  });

  const countries = countriesData?.data || [];

  const countryOptions = countries.map((c) => ({
    value: c.country,
    label: `${c.country} (${c.currency.code} ${c.currency.symbol})`,
  }));

  // Get selected currency info
  const selectedCountryData = countries.find(
    (c) => c.country === form.country
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Business name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.country) newErrors.country = "Country is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await businessService.create(form);
      onSuccess();
    } catch (error) {
      setApiError(
        error.response?.data?.message || "Could not create business"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* API Error */}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{apiError}</p>
        </div>
      )}

      <Input
        label="Business Name"
        name="name"
        placeholder="e.g. Arinze Trading Co."
        value={form.name}
        onChange={handleChange}
        error={errors.name}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="Business phone"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
        />

        <Input
          label="Email (Optional)"
          name="email"
          type="email"
          placeholder="Business email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
      </div>

      <Select
        label="Country"
        name="country"
        value={form.country}
        onChange={handleChange}
        options={countryOptions}
        placeholder="Select country"
        error={errors.country}
      />

      {/* Show selected currency */}
      {selectedCountryData && (
        <div className="bg-primary-500/10 border border-primary-500/20
                        rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600/20 rounded-lg
                          flex items-center justify-center">
            <span className="text-primary-400 font-bold text-sm">
              {selectedCountryData.currency.symbol}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {selectedCountryData.currency.name}
            </p>
            <p className="text-dark-400 text-xs">
              Default currency for this business •{" "}
              {selectedCountryData.currency.code}
            </p>
          </div>
        </div>
      )}

      <Input
        label="Business Location"
        name="location"
        placeholder="e.g. Lagos Island, Lagos"
        value={form.location}
        onChange={handleChange}
        error={errors.location}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          Create Business
        </Button>
      </div>
    </form>
  );
}