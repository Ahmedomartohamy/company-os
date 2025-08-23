import { useAuth } from '@/app/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email?: string;
  role?: string;
}

export default function Debug() {
  const { session, user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        // Try to fetch user profile from profiles table if it exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', user.id)
          .single();

        if (error) {
          // If profiles table doesn't exist or no profile found, that's okay
          setProfileError(error.message);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        setProfileError('Failed to fetch profile');
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const appEnv = import.meta.env.VITE_APP_ENV || 'development';
  const appVersion = '0.2.0'; // From package.json
  const sessionExpiresAt = session?.expires_at 
    ? new Date(session.expires_at * 1000).toLocaleString()
    : 'N/A';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">User ID:</span>
              <span className="ml-2 font-mono text-sm">{user?.id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-2">{user?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Email Confirmed:</span>
              <span className="ml-2">{user?.email_confirmed_at ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Last Sign In:</span>
              <span className="ml-2">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          {profileLoading ? (
            <div className="text-gray-500">Loading profile...</div>
          ) : profileError ? (
            <div className="text-amber-600">
              <div className="font-medium">Profile Status:</div>
              <div className="text-sm mt-1">No profile table or data found</div>
              <div className="text-xs mt-1 text-gray-500">{profileError}</div>
            </div>
          ) : profile ? (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Profile ID:</span>
                <span className="ml-2 font-mono text-sm">{profile.id}</span>
              </div>
              <div>
                <span className="font-medium">Profile Email:</span>
                <span className="ml-2">{profile.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Role:</span>
                <span className="ml-2">{profile.role || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No profile data available</div>
          )}
        </div>

        {/* Session Information */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Session Information</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Session Active:</span>
              <span className="ml-2">{session ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="font-medium">Access Token:</span>
              <span className="ml-2 font-mono text-xs">
                {session?.access_token 
                  ? `${session.access_token.substring(0, 20)}...` 
                  : 'N/A'
                }
              </span>
            </div>
            <div>
              <span className="font-medium">Token Type:</span>
              <span className="ml-2">{session?.token_type || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Expires At:</span>
              <span className="ml-2">{sessionExpiresAt}</span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span>
              <span className="ml-2 font-mono text-xs">
                {session?.refresh_token 
                  ? `${session.refresh_token.substring(0, 20)}...` 
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Application Information */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Application Information</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium">App Version:</span>
              <span className="ml-2">{appVersion}</span>
            </div>
            <div>
              <span className="font-medium">Environment:</span>
              <span className="ml-2 capitalize">{appEnv}</span>
            </div>
            <div>
              <span className="font-medium">Supabase URL:</span>
              <span className="ml-2 font-mono text-xs">
                {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
              </span>
            </div>
            <div>
              <span className="font-medium">Build Time:</span>
              <span className="ml-2">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Session Data (for debugging) */}
      <div className="mt-6 bg-gray-50 rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Raw Session Data</h2>
        <pre className="text-xs overflow-auto bg-white p-3 rounded border">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}