import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Profile() {
  const [user, setUser] = useState({ address: {}, username: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setError('Please log in to view profile');
        navigate('/user/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch profile');
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please log in to update profile');
      navigate('/user/login');
      return;
    }

    // Validate address and username before update
    if (!user.address.street || !user.username) {
      toast.error('Street address and username are required for checkout');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:5000/api/auth/update-profile',
        { username: user.username, address: user.address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated successfully');
      console.log('Profile update response:', response.data);
      setIsEditing(false); // Close the form after update
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response?.status === 400 && err.response?.data?.message === 'Username already taken') {
        toast.error('Username already taken. Please choose a different one.', {
          position: 'top-center',
        });
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again later or contact support.');
      } else {
        toast.error('Failed to update profile: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
      address: {
        ...prev.address,
        ...(name.startsWith('address.') ? { [name.split('.')[1]]: value } : {}),
      },
    }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Profile</h1>
      {!isEditing ? (
        <div className="bg-white shadow-md rounded-lg p-4 max-w-md mx-auto">
          <h2 className="font-semibold text-xl mb-4">Profile Details</h2>
          <p><strong>Username:</strong> {user.username || 'Not set'}</p>
          <h3 className="font-medium mt-4">Address</h3>
          <p><strong>Street:</strong> {user.address.street || 'Not set'}</p>
          <p><strong>City:</strong> {user.address.city || 'Not set'}</p>
          <p><strong>State:</strong> {user.address.state || 'Not set'}</p>
          <p><strong>Zip:</strong> {user.address.zip || 'Not set'}</p>
          <p><strong>Country:</strong> {user.address.country || 'Not set'}</p>
          <p><strong>Contact Number:</strong> {user.address.contactNo || 'Not set'}</p>
          {!user.username || !user.address.street && (
            <p className="text-red-500 mt-4">Note: Please update your username and street address to proceed with checkout.</p>
          )}
          <button
            onClick={handleEditClick}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="font-semibold text-xl mb-4">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-gray-700">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="username"
                value={user.username || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <h3 className="font-medium mt-4">Address</h3>
            <div>
              <label className="block text-gray-700">Street <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="address.street"
                value={user.address.street || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                name="address.city"
                value={user.address.city || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">State</label>
              <input
                type="text"
                name="address.state"
                value={user.address.state || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Zip</label>
              <input
                type="text"
                name="address.zip"
                value={user.address.zip || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Country</label>
              <input
                type="text"
                name="address.country"
                value={user.address.country || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Contact Number</label>
              <input
                type="text"
                name="address.contactNo"
                value={user.address.contactNo || ''}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., +91-1234567890"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;