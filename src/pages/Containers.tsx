import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ArrowPathIcon, BellIcon, ExclamationCircleIcon, CheckCircleIcon, CubeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

type Container = Database['public']['Tables']['containers']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

const THRESHOLDS = {
    temperature: { low: 2, high: 8 }, // °C
    humidity: { low: 30, high: 70 }, // %
    battery: { low: 20, high: 80 }, // %
};

const getStatusColor = (value: number, type: 'temperature' | 'humidity' | 'battery'): string => {
    const threshold = THRESHOLDS[type];
    if (value < threshold.low) return 'text-blue-600 bg-blue-100';
    if (value > threshold.high) return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
};

const getStatusMessage = (container: Container) => {
    const messages: string[] = [];
    
    if (container.temperature < THRESHOLDS.temperature.low) {
        messages.push(`Temperature too low: ${container.temperature}°C`);
    } else if (container.temperature > THRESHOLDS.temperature.high) {
        messages.push(`Temperature too high: ${container.temperature}°C`);
    }
    
    if (container.humidity < THRESHOLDS.humidity.low) {
        messages.push(`Humidity too low: ${container.humidity}%`);
    } else if (container.humidity > THRESHOLDS.humidity.high) {
        messages.push(`Humidity too high: ${container.humidity}%`);
    }
    
    if (container.battery_level < THRESHOLDS.battery.low) {
        messages.push(`Battery low: ${container.battery_level}%`);
    }
    
    return messages;
};

const Containers = () => {
    const [availableContainers, setAvailableContainers] = useState<Container[]>([]);
    const [unassignedContainers, setUnassignedContainers] = useState<Container[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [selectedContainerForAssignment, setSelectedContainerForAssignment] = useState<Container | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

    const fetchContainers = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const [assignedResponse, unassignedResponse] = await Promise.all([
                supabase
                    .from('containers')
                    .select('*')
                    .not('assigned_to', 'is', null)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('containers')
                    .select('*')
                    .is('assigned_to', null)
                    .order('created_at', { ascending: false })
            ]);

            if (assignedResponse.error) throw assignedResponse.error;
            if (unassignedResponse.error) throw unassignedResponse.error;

            setAvailableContainers(assignedResponse.data || []);
            setUnassignedContainers(unassignedResponse.data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Fetch error:', err);
            toast.error('Failed to fetch containers');
        }
    }, []);

    const fetchVehicles = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('transporter_id', userData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (err: any) {
            console.error('Error fetching vehicles:', err);
            toast.error('Failed to fetch vehicles');
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchContainers(), fetchVehicles()]);
        setIsRefreshing(false);
        toast.success('Data refreshed successfully');
    };

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchContainers(), fetchVehicles()])
            .finally(() => setIsLoading(false));
    }, [fetchContainers, fetchVehicles]);

    const openVehicleSelectionModal = (container: Container) => {
        setSelectedContainerForAssignment(container);
        setIsVehicleModalOpen(true);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedContainerForAssignment || !selectedVehicleId) {
            toast.error('Please select a container and vehicle');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            const { error } = await supabase
                .from('containers')
                .update({
                    assigned_to: userData.id,
                    vehicle_id: selectedVehicleId,
                    status: 'active'
                })
                .eq('id', selectedContainerForAssignment.id);

            if (error) throw error;

            await fetchContainers();
            setIsVehicleModalOpen(false);
            setSelectedContainerForAssignment(null);
            setSelectedVehicleId(null);
            toast.success('Container assigned successfully');
        } catch (err: any) {
            console.error('Assignment error:', err);
            toast.error('Failed to assign container');
        }
    };

    const handleCompleteOrder = async (container: Container) => {
        try {
            const { error } = await supabase
                .from('containers')
                .update({
                    assigned_to: null,
                    vehicle_id: null,
                    status: 'inactive'
                })
                .eq('id', container.id);

            if (error) throw error;

            await fetchContainers();
            toast.success('Order completed successfully');
        } catch (err: any) {
            console.error('Complete order error:', err);
            toast.error('Failed to complete order');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Container Management</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Unassigned Containers */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Unassigned Containers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedContainers.map(container => (
                                <div key={container.id} className="border rounded-lg p-4">
                                    <h3 className="font-medium">{container.name}</h3>
                                    <p className="text-sm text-gray-500">{container.location}</p>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => openVehicleSelectionModal(container)}
                                            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Assign Vehicle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Containers */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Assigned Containers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableContainers.map(container => (
                                <div key={container.id} className="border rounded-lg p-4">
                                    <h3 className="font-medium">{container.name}</h3>
                                    <p className="text-sm text-gray-500">{container.location}</p>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleCompleteOrder(container)}
                                            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Complete Order
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vehicle Assignment Modal */}
                {isVehicleModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">Assign Vehicle</h3>
                            <select
                                value={selectedVehicleId || ''}
                                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                                className="w-full p-2 border rounded mb-4"
                            >
                                <option value="">Select a vehicle</option>
                                {vehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate_number} - {vehicle.model}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsVehicleModalOpen(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAssignment}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Containers;