// src/pages/agent/EditTripPackage.jsx
// Modal that opens when editing an existing trip

import { useState } from "react";
import Modal from "../../components/common/Modal";
import TripPackageForm from "../../components/forms/TripPackageForm";
import { toast } from "react-hot-toast";

function EditTripPackage({ isOpen, onClose, trip, onTripUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!trip) return null;

  const handleSubmit = (formData) => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const updatedTrip = {
        ...trip,
        ...formData,
      };

      if (onTripUpdated) {
        onTripUpdated(updatedTrip);
      }

      toast.success("Trip updated successfully!");
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Trip" size="lg">
      <TripPackageForm
        initialData={trip}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Update Trip"
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

export default EditTripPackage;