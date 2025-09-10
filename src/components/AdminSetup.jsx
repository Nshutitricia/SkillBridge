import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// This component helps you set up admin roles
// You can access it at /admin-setup (add this route temporarily)
export default function AdminSetup() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching users:', error);
        setMessage('Error fetching users: ' + error.message);
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error fetching users: ' + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const assignAdminRole = async () => {
    if (!selectedUser) {
      setMessage('Please select a user');
      return;
    }

    try {
      setMessage('Assigning admin role...');
      
      // First, check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('role_name', 'admin')
        .single();

      if (existingRole) {
        // Update existing role to active
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ is_active: true })
          .eq('user_id', selectedUser)
          .eq('role_name', 'admin');

        if (updateError) throw updateError;
        setMessage('Admin role activated successfully!');
      } else {
        // Create new admin role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser,
            role_name: 'admin',
            is_active: true
          });

        if (insertError) throw insertError;
        setMessage('Admin role assigned successfully!');
      }

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error assigning admin role:', error);
      setMessage('Error assigning admin role: ' + error.message);
    }
  };

  const removeAdminRole = async () => {
    if (!selectedUser) {
      setMessage('Please select a user');
      return;
    }

    try {
      setMessage('Removing admin role...');
      
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', selectedUser)
        .eq('role_name', 'admin');

      if (error) throw error;
      setMessage('Admin role removed successfully!');
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error removing admin role:', error);
      setMessage('Error removing admin role: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-green-700 mb-6">Admin Setup</h1>
          <p className="text-gray-600 mb-8">
            Use this tool to assign admin roles to users. Only users with admin roles can access the admin dashboard.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User to Manage Admin Role
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={assignAdminRole}
                disabled={!selectedUser}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign Admin Role
              </button>
              <button
                onClick={removeAdminRole}
                disabled={!selectedUser}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove Admin Role
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Check in database
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Select a user from the dropdown above</li>
                <li>Click "Assign Admin Role" to make them an admin</li>
                <li>They can now access the admin dashboard at /admin</li>
                <li>Use "Remove Admin Role" to revoke admin access</li>
                <li>After setup, you can remove this component from your app</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
