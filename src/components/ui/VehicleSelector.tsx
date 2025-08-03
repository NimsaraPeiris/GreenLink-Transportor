import React from 'react';
import { Vehicle } from '../../hooks/useVehicles';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicleId: string) => void;
  loading?: boolean;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Vehicle
        </label>
        <div className="animate-pulse h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Vehicle
      </label>
      <select
        value={selectedVehicleId || ''}
        onChange={(e) => onVehicleSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">-- Select a vehicle --</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id.toString()}>
            {vehicle.plate_number} - {vehicle.model} (Capacity: {vehicle.capacity}kg)
          </option>
        ))}
      </select>
    </div>
  );
};

export default VehicleSelector;
