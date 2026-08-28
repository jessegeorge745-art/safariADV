// src/pages/agent/CreateTripPackage.jsx
// Modal that opens when creating a new trip

import { useState } from "react";
import Modal from "../../components/common/Modal";
import TripPackageForm from "../../components/forms/TripPackageForm";
import { toast } from "react-hot-toast";

function CreateTripPackage({ isOpen, onClose, onTripCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (formData) => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newTrip = {
        id: Date.now(),
        ...formData,
        status: "pending",
        image: "",
      };

      if (onTripCreated) {
        onTripCreated(newTrip);
      }

      toast.success("Trip created successfully! Waiting for admin approval.");
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Trip" size="lg">
      <TripPackageForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Trip"
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

export default CreateTripPackage;