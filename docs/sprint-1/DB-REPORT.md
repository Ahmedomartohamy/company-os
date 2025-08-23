# Database Migration Report - Sprint 1

## Overview
This report documents the database schema changes implemented in Sprint 1 for Contacts Management and Role-Based Access Control (RBAC) functionality.

## Migration File
- **File**: `supabase/contacts-migration.sql`
- **Purpose**: Add contacts table, audit logging, and enhanced RBAC policies
- **Dependencies**: Requires existing `clients` and `profiles` tables

## New Tables Created

### 1. `contacts` Table
Stores contact information linked to clients with ownership tracking.

**Schema**:
```sql
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `contacts_client_idx`: Fast lookups by client
- `contacts_email_idx`: Email-based searches
- `contacts_name_trgm`: Full-text search on names using trigram matching

**Row Level Security Policies**:
- `contacts_read_all_auth`: All authenticated users can read contacts
- `contacts_insert_role`: Only admin/sales_manager/sales_rep can create contacts
- `contacts_update_owner_or_mgr`: Contact owners and managers can update
- `contacts_delete_admin_only`: Only admins can delete contacts

### 2. `audit_logs` Table
Tracks all changes to contacts for compliance and debugging.

**Schema**:
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_id UUID,
  action TEXT CHECK (action IN ('insert','update','delete')) NOT NULL,
  actor_id UUID,
  at TIMESTAMPTZ DEFAULT NOW(),
  diff JSONB
);
```

**Features**:
- Captures INSERT, UPDATE, DELETE operations
- Stores actor (user) performing the action
- Records JSON diff of changes for updates
- Extensible to other tables beyond contacts

## Enhanced RBAC System

### Profile Role Column
- Added `role` column to `profiles` table if not exists
- Default role: `'user'`
- Supported roles: `admin`, `sales_manager`, `sales_rep`, `user`

### Updated Profiles Policies
- **Read**: All authenticated users can view profiles
- **Update**: Users can update own profile OR managers can update subordinates
- **Admin Update**: Admins have full update access
- **Insert**: Users can only create their own profile

## Audit Logging Implementation

### Trigger Function
- **Function**: `log_contacts_changes()`
- **Language**: PL/pgSQL
- **Trigger**: `trg_contacts_audit` on contacts table

### Audit Behavior
- **INSERT**: Logs full new record
- **UPDATE**: Logs only changed fields (diff)
- **DELETE**: Logs full deleted record
- **Actor Tracking**: Uses `auth.uid()` to identify user

## How to Apply Migration

### Prerequisites
1. Ensure base tables exist (`clients`, `profiles`)
2. Have Supabase project with SQL Editor access
3. Authenticated user with database admin privileges

### Steps
1. **Open Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Access SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Create new query or use existing tab

3. **Execute Migration**
   - Copy entire contents of `supabase/contacts-migration.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for completion message

4. **Verify Migration**
   - Check output for "Migration Summary" results
   - Verify table structure in "Table Editor"
   - Test RLS policies with different user roles

### Expected Output
Successful migration will show:
```
info: Migration Summary
contacts_status: Contacts table created
audit_status: Audit logging enabled
rbac_status: RBAC policies updated
```

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce role-based access patterns
- Contact ownership respected in update/delete operations

### Audit Trail
- All contact modifications are logged
- Actor identification prevents anonymous changes
- JSON diffs provide detailed change history
- Immutable audit log (no delete policies)

### Data Integrity
- Foreign key constraints maintain referential integrity
- Check constraints validate audit action types
- Cascade rules handle client/user deletions gracefully

## Testing Recommendations

### Functional Testing
1. Create contacts with different user roles
2. Test update permissions (owner vs manager vs admin)
3. Verify delete restrictions (admin only)
4. Check audit log entries after each operation

### Security Testing
1. Attempt unauthorized operations with different roles
2. Verify RLS policies block inappropriate access
3. Test cascade behavior when deleting clients/users
4. Confirm audit logs capture all required information

## Next Steps

After successful migration:
1. Update application code to use new contacts table
2. Implement role-based UI components
3. Add contact management features to frontend
4. Create admin interface for audit log review
5. Test end-to-end contact workflows

## Files Modified/Created

### Created
- `supabase/contacts-migration.sql` - Database migration script
- `docs/sprint-1/DB-REPORT.md` - This documentation

### Database Objects Created
- Table: `public.contacts`
- Table: `public.audit_logs`
- Function: `public.log_contacts_changes()`
- Trigger: `trg_contacts_audit`
- Multiple RLS policies for contacts and profiles
- Indexes for performance optimization

---

**Migration Status**: ✅ Ready for execution  
**Documentation**: ✅ Complete  
**Security Review**: ✅ Passed  
**Testing**: ⏳ Pending application integration