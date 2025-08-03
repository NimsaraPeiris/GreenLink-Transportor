import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // adjust path as needed
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Shield
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface DBUser {
  id: number;
  name: string;
  email: string;
  role: 'Transporter' | 'Logistics Company' | 'Certifier' | 'Admin';
  status: 'active' | 'pending' | 'suspended';
  credits: number;
  join_date: string;
  avatar_url?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<DBUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', avatar_url: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error) {
        console.error('Failed to fetch user:', error);
        return;
      }

      setUser(data);
      if (data) {
        setFormData({ name: data.name || '', avatar_url: data.avatar_url || '' });
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ name: formData.name, avatar_url: formData.avatar_url, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Update auth user metadata
      const { data: { user: authUser }, error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.name, avatar_url: formData.avatar_url }
      });
      
      if (authError) throw authError;

      // Refresh local user state
      if (authUser) {
         const updatedUser = { ...user, name: formData.name, avatar_url: formData.avatar_url, updated_at: new Date().toISOString() };
         setUser(updatedUser as DBUser); // Cast because authUser.user_metadata might not match DBUser exactly
      }


      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setIsUploading(true);
    setMessage(null);

    try {
      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update form data with new avatar URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: `Failed to upload image: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing && user) { // Reset form data if cancelling
        setFormData({ name: user.name || '', avatar_url: user.avatar_url || '' });
    }
    setIsEditing(!isEditing);
    setMessage(null); // Clear messages when toggling edit mode
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: `Failed to change password: ${error.message}` });
    } finally {
      setIsChangingPassword(false);
    }
  };


  if (!user) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
       {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 text-lg">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center pb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-4 border-white shadow-md flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(isEditing ? formData.name : user.name)
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase())
                      .slice(0, 2)
                      .join('')
                    }
                  </span>
                </div>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-secondary-900">
                {isEditing ? formData.name : user.name}
              </h2>

              <p className="text-secondary-500">{user.role}</p>

              <div className="mt-4 flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                <Building className="h-4 w-4 mr-1" />
                {user.status}
              </div>

              <div className="mt-6 w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleToggleEdit}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-secondary-100">
              <h3 className="text-sm font-medium text-secondary-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm text-secondary-700">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-secondary-500 mr-3" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-secondary-100">
              <h3 className="text-sm font-medium text-secondary-900 mb-4">
                Account Information
              </h3>
              <div className="space-y-3 text-sm text-secondary-700">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Member since</span>
                  <span>
                    {new Date(user.join_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-secondary-500">Account ID</span>
                  <span>{user.id}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-secondary-900">
                {isEditing ? 'Edit Profile Information' : 'Profile Information'}
              </h3>

              {isEditing && (
                <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="input w-full"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="input w-full bg-secondary-50 cursor-not-allowed"
                        value={user.email}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        className="input w-full bg-secondary-50 cursor-not-allowed"
                        value={user.role}
                        disabled
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-secondary-500">Name</p>
                    <p className="text-secondary-900 font-medium">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Email</p>
                    <p className="text-secondary-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Role</p>
                    <p className="text-secondary-900 font-medium">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Status</p>
                    <p className="text-secondary-900 font-medium">{user.status}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-secondary-900">
                Account Security
              </h3>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => { setShowPasswordForm(!showPasswordForm); setMessage(null); }}>
                {showPasswordForm ? 'Cancel Change Password' : 'Change Password'}
              </Button>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4 p-4 border border-secondary-200 rounded-md bg-white shadow">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-secondary-700 mb-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className="input w-full"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="input w-full"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={isChangingPassword} className="w-full md:w-auto">
                    {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              )}

              <div className="pt-4 border-t border-secondary-100">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-secondary-500 mb-2">
                  Add an extra layer of security to your account
                </p>
                <Button variant="secondary">Enable 2FA</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
