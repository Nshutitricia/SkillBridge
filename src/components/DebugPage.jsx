import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

export default function DebugPage() {
  const { user, isAdmin, loading, userProfile } = useAuth();
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [tables, setTables] = useState([]);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        setDbStatus(`Error: ${error.message}`);
      } else {
        setDbStatus('Connected successfully');
      }

      // Check if admin tables exist
      const adminTables = ['user_roles', 'admin_actions', 'user_segments', 'admin_notifications'];
      const tableStatus = [];

      for (const table of adminTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          tableStatus.push({
            name: table,
            exists: !error,
            error: error?.message || null
          });
        } catch (err) {
          tableStatus.push({
            name: table,
            exists: false,
            error: err.message
          });
        }
      }

      setTables(tableStatus);
    } catch (error) {
      setDbStatus(`Connection failed: ${error.message}`);
    }
  };

  const testAdminRole = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    try {
      // Try to insert admin role
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_name: 'admin',
          is_active: true
        });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Admin role assigned successfully! Refresh the page to see changes.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-8">Debug Page</h1>
        
        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
              <p><strong>User Profile:</strong> {userProfile ? 'Loaded' : 'Not loaded'}</p>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
            <p><strong>Connection:</strong> {dbStatus}</p>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Admin Tables:</h3>
              <div className="space-y-2">
                {tables.map((table, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${table.exists ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-mono text-sm">{table.name}</span>
                    {table.error && <span className="text-red-600 text-xs">({table.error})</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <button
                onClick={checkDatabase}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Check Database Again
              </button>
              <button
                onClick={testAdminRole}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Assign Admin Role to Me
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Setup Instructions</h2>
            <ol className="space-y-2 text-blue-800">
              <li>1. First, run the SQL script in Supabase to create admin tables</li>
              <li>2. Click "Assign Admin Role to Me" button above</li>
              <li>3. Refresh the page to see if you're now an admin</li>
              <li>4. Go to <code className="bg-blue-100 px-2 py-1 rounded">/admin</code> to access admin dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

