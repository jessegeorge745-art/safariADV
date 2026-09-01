// src/components/forms/TripPackageForm.jsx
// Reusable form for creating and editing trips

import { useState } from "react";

function TripPackageForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Create Trip",
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    destination: initialData.destination || "",
    description: initialData.description || "",
    itinerary: initialData.itinerary || "",
    start_date: initialData.start_date?.slice(0, 10) || "",
    end_date: initialData.end_date?.slice(0, 10) || "",
    price: initialData.price || "",
    capacity: initialData.capacity || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const required = ["title", "destination", "start_date", "end_date", "price", "capacity"];

    required.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = `${field.replace("_", " ")} is required`;
      }
    });

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = "End date must be after start date";
    }

    if (formData.price && isNaN(formData.price)) {
      newErrors.price = "Price must be a number";
    }
    if (formData.capacity && isNaN(formData.capacity)) {
      newErrors.capacity = "Capacity must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Trip Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
            errors.title ? "border-red-500" : "border-zinc-600"
          } focus:border-amber-500 focus:outline-none`}
          placeholder="e.g., Safari Adventure"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Destination *
        </label>
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
            errors.destination ? "border-red-500" : "border-zinc-600"
          } focus:border-amber-500 focus:outline-none`}
          placeholder="e.g., Maasai Mara"
        />
        {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-white focus:border-amber-500 focus:outline-none"
          placeholder="Describe the trip..."
        />
      </div>

      {/* Itinerary */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Itinerary
        </label>
        <textarea
          name="itinerary"
          value={formData.itinerary}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-white focus:border-amber-500 focus:outline-none"
          placeholder="Day 1: Arrive... Day 2: Safari..."
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
              errors.start_date ? "border-red-500" : "border-zinc-600"
            } focus:border-amber-500 focus:outline-none`}
          />
          {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            End Date *
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
              errors.end_date ? "border-red-500" : "border-zinc-600"
            } focus:border-amber-500 focus:outline-none`}
          />
          {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
        </div>
      </div>

      {/* Price & Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Price (Ksh) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
              errors.price ? "border-red-500" : "border-zinc-600"
            } focus:border-amber-500 focus:outline-none`}
            placeholder="45000"
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Capacity *
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border bg-zinc-800 text-white ${
              errors.capacity ? "border-red-500" : "border-zinc-600"
            } focus:border-amber-500 focus:outline-none`}
            placeholder="12"
          />
          {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
        </div>
      </div>

      {/* Note about approval */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p className="text-yellow-400 text-sm">
          ⚠️ New trips start as <strong>pending</strong> until an admin approves them.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white border border-zinc-600 rounded-lg hover:bg-zinc-700 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TripPackageForm;