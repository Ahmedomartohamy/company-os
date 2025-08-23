# Sprint 2 Database Report

## Overview

This report documents the database schema changes for Sprint 2, focusing on the implementation of the leads management system.

## New Table: `public.leads`

### Table Structure

```sql
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name  text,
  company    text,
  email      text,
  phone      text,
  source text check (source in ('website','referral','ads','social','cold_call','other')) default 'other',
  status text check (status in ('new','contacted','qualified','unqualified')) default 'new',
  score int default 0,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);
```

### Key Features

- **UUID Primary Key**: Auto-generated unique identifier
- **Contact Information**: First name, last name, company, email, phone
- **Lead Source Tracking**: Constrained to predefined sources (website, referral, ads, social, cold_call, other)
- **Lead Status Management**: Four-stage pipeline (new, contacted, qualified, unqualified)
- **Lead Scoring**: Integer field for qualification scoring
- **Owner Assignment**: References auth.users for lead ownership
- **Notes Field**: Free-text field for additional information
- **Audit Trail**: Created timestamp for tracking

## Indexes Created

| Index Name          | Type   | Purpose                                  |
| ------------------- | ------ | ---------------------------------------- |
| `leads_status_idx`  | B-tree | Fast filtering by lead status            |
| `leads_source_idx`  | B-tree | Fast filtering by lead source            |
| `leads_owner_idx`   | B-tree | Fast filtering by owner                  |
| `leads_company_idx` | B-tree | Case-insensitive company search          |
| `leads_name_trgm`   | GIN    | Full-text search on names using trigrams |
| `leads_email_idx`   | B-tree | Fast email lookups                       |

## Row Level Security (RLS) Policies

### Read Access

- **Policy**: `leads_read_all_auth`
- **Scope**: All authenticated users can read leads
- **Rationale**: Enables visibility across sales team

### Insert Access

- **Policy**: `leads_insert_role`
- **Scope**: admin, sales_manager, sales_rep roles
- **Rationale**: Only sales personnel can create leads

### Update Access

- **Policy**: `leads_update_owner_or_mgr`
- **Scope**: Lead owner OR admin/sales_manager roles
- **Rationale**: Owners can update their leads, managers can update any

### Delete Access

- **Policy**: `leads_delete_admin_only`
- **Scope**: admin role only
- **Rationale**: Prevents accidental data loss, maintains audit trail

## Audit Integration

### Audit Function

- **Function**: `public.log_leads_changes()`
- **Trigger**: `trg_leads_audit`
- **Integration**: Uses existing `public.audit_logs` table from Sprint 1
- **Operations**: Tracks INSERT, UPDATE, DELETE operations
- **Data**: Stores complete change diff in JSONB format

### Audit Log Structure

```sql
-- Reuses existing audit_logs table:
-- table_name: 'leads'
-- row_id: lead UUID
-- action: 'insert'|'update'|'delete'
-- actor_id: auth.uid() of user making change
-- diff: JSONB of changes
-- at: timestamp of change
```

## Performance Considerations

### Optimized Queries

- **Name Search**: GIN index with trigrams for fuzzy matching
- **Company Search**: Lowercase index for case-insensitive search
- **Status/Source Filtering**: B-tree indexes for fast filtering
- **Owner Assignment**: Indexed for quick owner-based queries

### Expected Query Patterns

1. List leads by status (new, contacted, etc.)
2. Search leads by name or company
3. Filter leads by source
4. Show leads assigned to specific owner
5. Email lookup for duplicate detection

## Migration File

- **Location**: `supabase/migrations/2025-08-23-s2-leads.sql`
- **Transaction**: Wrapped in BEGIN/COMMIT for atomicity
- **Dependencies**: Requires `pg_trgm` extension and existing `audit_logs` table

## Deployment Instructions

⚠️ **Important**: Run this file in Supabase SQL Editor AFTER code review.

### Pre-deployment Checklist

1. ✅ Code review completed
2. ✅ Migration file validated
3. ✅ Backup strategy confirmed
4. ✅ Rollback plan prepared

### Deployment Steps

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/2025-08-23-s2-leads.sql`
4. Execute migration
5. Verify table creation and policies
6. Test basic CRUD operations

## Lead Conversion Function

### `public.convert_lead()` Function

A utility function to convert leads into clients and contacts.

#### Usage

```sql
select public.convert_lead('<LEAD_UUID>'::uuid, null, true, true);
```

#### Parameters

- `_lead_id`: UUID of the lead to convert (required)
- `_client_id`: Existing client UUID (optional, defaults to null)
- `_create_client`: Whether to create a new client if none exists (defaults to true)
- `_create_contact`: Whether to create a contact record (defaults to true)

#### Return Value

Returns JSONB with keys:

- `lead_id`: The original lead UUID
- `client_id`: The client UUID (existing or newly created)
- `contact_id`: The contact UUID (if created)

#### Security Notes

- Function is NOT security definer
- Relies on existing RLS policies and user roles
- Respects table-level permissions for clients and contacts

## Next Steps (Sprint 3)

- Lead conversion to contacts/opportunities
- Lead assignment automation
- Lead scoring algorithm implementation
- Bulk import functionality
- Lead deduplication logic

---

**Migration Status**: ⏳ Ready for Review  
**Estimated Deployment Time**: 2-3 minutes  
**Risk Level**: Low (additive changes only)
