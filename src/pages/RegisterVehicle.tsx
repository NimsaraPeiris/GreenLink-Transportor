import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type VehicleFormData = {
    plate_number: string;
    model: string;
    capacity: number;
    status: 'active' | 'inactive';
};

const RegisterVehicle = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [vehicleId, setVehicleId] = useState<string | null>(null);
    const [formData, setFormData] = useState<VehicleFormData>({
        plate_number: '',
        model: '',
        capacity: 0,
        status: 'active'
    });

const loadUserVehicle = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

        if (userError || !userData) throw new Error('Failed to get user data');

        const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('transporter_id', userData.id)
            .single();

        if (!vehicleError && vehicleData) {
            setFormData({
                plate_number: vehicleData.plate_number,
                model: vehicleData.model,
                capacity: vehicleData.capacity,
                status: vehicleData.status
            });
            setIsEditMode(true);
            setVehicleId(vehicleData.id);
        } else {
            setIsEditMode(false);
            setVehicleId(null);
        }
    } catch (error) {
        console.error('Error loading vehicle:', error);
    }
};

useEffect(() => {
    loadUserVehicle();
}, []);


const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user's ID from the users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single();

            if (userError || !userData) throw new Error('Failed to get user data');

            let error;
            
            if (isEditMode && vehicleId) {
                // Update existing vehicle
                const { error: updateError } = await supabase
                    .from('vehicles')
                    .update(formData)
                    .eq('id', vehicleId);
                error = updateError;
            } else {
                // Insert new vehicle
                const { error: insertError } = await supabase
                    .from('vehicles')
                    .insert({
                        ...formData,
                        transporter_id: userData.id,
                    });
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditMode ? 'Vehicle updated successfully' : 'Vehicle registered successfully');
            navigate('/vehicles'); // Redirect to vehicles list
        } catch (error: any) {
            console.error('Error registering vehicle:', error);
            toast.error(error.message || 'Failed to register vehicle');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' ? parseInt(value) || 0 : value
        }));
    };

    return (
        <DashboardLayout>
            <div className="p-4">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                    <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                        {isEditMode ? 'Edit Your Vehicle' : 'Register Vehicle'}
                    </h1>
                    
                    {isEditMode && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                📝 You already have a vehicle registered. You can edit the details below.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-1">
                                Plate Number
                            </label>
                            <input
                                type="text"
                                id="plate_number"
                                name="plate_number"
                                required
                                value={formData.plate_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter vehicle plate number"
                            />
                        </div>

                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Model
                            </label>
                            <input
                                type="text"
                                id="model"
                                name="model"
                                required
                                value={formData.model}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter vehicle model"
                            />
                        </div>

                        <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                                Capacity (in units)
                            </label>
                            <input
                                type="number"
                                id="capacity"
                                name="capacity"
                                required
                                min="1"
                                value={formData.capacity}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter vehicle capacity"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                        >
                            {isLoading 
                                ? (isEditMode ? 'Updating...' : 'Registering...') 
                                : (isEditMode ? 'Update Vehicle' : 'Register Vehicle')
                            }
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RegisterVehicle;
