import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Admin Role Manager - Only accessible from within admin dashboard
export default function AdminRoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [showManager, setShowManager] = useState(false);

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
      
      // Check if user already has admin role
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
      
      fetchUsers();
    } catch (error) {
      console.error('Error removing admin role:', error);
      setMessage('Error removing admin role: ' + error.message);
    }
  };

  if (!showManager) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Role Management</h3>
            <p className="text-sm text-gray-600">Manage admin roles for users</p>
          </div>
          <button
            onClick={() => setShowManager(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Roles
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Admin Role Management</h3>
        <button
          onClick={() => setShowManager(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
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
      </div>
    </div>
  );
}
