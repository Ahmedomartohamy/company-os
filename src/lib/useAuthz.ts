import { useAuth } from '@/app/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

type Role = 'admin' | 'sales_manager' | 'sales_rep' | 'viewer';
type Action = 'view' | 'create' | 'update' | 'delete';
type Resource = 'contacts' | 'clients' | 'projects' | 'tasks' | 'opportunities' | 'leads';

interface AuthzRecord {
  owner_id?: string;
  [key: string]: any;
}

interface AuthzResult {
  role: Role | null;
  can: (action: Action, resource: Resource, record?: AuthzRecord) => boolean;
}

// Permission mappings based on requirements
const PERMISSIONS: Record<string, Role[]> = {
  'contacts.view': ['admin', 'sales_manager', 'sales_rep', 'viewer'],
  'contacts.create': ['admin', 'sales_manager', 'sales_rep'],
  'contacts.update': ['admin', 'sales_manager', 'sales_rep'],
  'contacts.delete': ['admin'],
  'clients.view': ['admin', 'sales_manager', 'sales_rep', 'viewer'],
  'clients.create': ['admin', 'sales_manager'],
  'clients.update': ['admin', 'sales_manager'],
  'clients.delete': ['admin'],
  'projects.view': ['admin', 'sales_manager', 'viewer'],
  'projects.create': ['admin', 'sales_manager'],
  'projects.update': ['admin', 'sales_manager'],
  'projects.delete': ['admin'],
  'tasks.view': ['admin', 'sales_manager', 'viewer'],
  'tasks.create': ['admin', 'sales_manager'],
  'tasks.update': ['admin', 'sales_manager'],
  'tasks.delete': ['admin'],
  'opportunities.view': ['admin', 'sales_manager', 'sales_rep', 'viewer'],
  'opportunities.create': ['admin', 'sales_manager', 'sales_rep'],
  'opportunities.update': ['admin', 'sales_manager', 'sales_rep'],
  'opportunities.delete': ['admin'],
};

export function useAuthz(): AuthzResult {
  const { user } = useAuth();

  // Fetch user profile with role
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const role = (profile?.role as Role) || null;

  const can = (action: Action, resource: Resource, record?: AuthzRecord): boolean => {
    if (!role) return false;

    const permission = `${resource}.${action}`;
    const allowedRoles = PERMISSIONS[permission] || [];

    // Check basic role permission
    if (!allowedRoles.includes(role)) return false;

    // Special case: sales_rep can only update/delete their own records
    if (role === 'sales_rep' && (action === 'update' || action === 'delete') && record) {
      return record.owner_id === user?.id;
    }

    return true;
  };

  return { role, can };
}
