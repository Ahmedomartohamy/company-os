# Sprint 3 Database Report

## Overview
This report documents the database migration for Sprint 3, which introduces the opportunities management system with pipelines and stages.

## Migration File
- **File**: `supabase/migrations/2025-08-23-s3-opportunities.sql`
- **Purpose**: Create opportunities, pipelines, and stages tables with proper indexing, RLS policies, and audit triggers

## Database Schema Changes

### New Tables Created

#### 1. `public.pipelines`
- **Purpose**: Define sales pipelines for organizing opportunities
- **Key Fields**:
  - `id` (UUID, Primary Key)
  - `name` (Text, Required)
  - `created_at` (Timestamp)

#### 2. `public.stages`
- **Purpose**: Define stages within each pipeline
- **Key Fields**:
  - `id` (UUID, Primary Key)
  - `pipeline_id` (UUID, Foreign Key to pipelines)
  - `name` (Text, Required)
  - `position` (Integer, Required)
  - `probability` (Integer, 0-100%)
  - `created_at` (Timestamp)
- **Constraints**: Unique constraint on (pipeline_id, position)

#### 3. `public.opportunities`
- **Purpose**: Store sales opportunities with full tracking
- **Key Fields**:
  - `id` (UUID, Primary Key)
  - `client_id` (UUID, Foreign Key to clients)
  - `contact_id` (UUID, Foreign Key to contacts)
  - `name` (Text, Required)
  - `amount` (Numeric 12,2)
  - `currency` (Text, Default 'USD')
  - `pipeline_id` (UUID, Foreign Key to pipelines)
  - `stage_id` (UUID, Foreign Key to stages)
  - `owner_id` (UUID, Foreign Key to auth.users)
  - `close_date` (Date)
  - `probability` (Integer, 0-100%)
  - `status` (Text, 'open'/'won'/'lost')
  - `created_at` (Timestamp)

### Indexes Created
- `stages_pipeline_idx`: Index on stages.pipeline_id
- `opp_stage_idx`: Index on opportunities.stage_id
- `opp_pipe_idx`: Index on opportunities.pipeline_id
- `opp_status_idx`: Index on opportunities.status
- `opp_owner_idx`: Index on opportunities.owner_id
- `opp_close_idx`: Index on opportunities.close_date
- `opp_name_trgm`: GIN trigram index on opportunities.name for text search
- `opp_amount_idx`: Index on opportunities.amount

### Row Level Security (RLS) Policies

#### Pipelines & Stages
- **Read**: All authenticated users can view
- **Write**: Only Admin and Sales Manager roles can create/update/delete

#### Opportunities
- **Read**: All authenticated users can view
- **Insert**: Admin, Sales Manager, and Sales Rep roles can create
- **Update**: Opportunity owner or Admin/Sales Manager can update
- **Delete**: Only Admin role can delete

### Audit System
- **Function**: `public.log_opp_changes()`
- **Trigger**: `trg_opp_audit` on opportunities table
- **Purpose**: Logs all INSERT, UPDATE, DELETE operations to audit_logs table

### RPC Functions

#### `public.move_opportunity_stage()`
- **Purpose**: Move an opportunity to a different stage and automatically update its probability
- **Parameters**:
  - `_opp_id` (UUID): The opportunity ID to move
  - `_stage_id` (UUID): The target stage ID
- **Behavior**: 
  - Updates the opportunity's stage_id
  - Automatically sets the opportunity's probability to match the stage's probability
  - If stage has no probability set, keeps the opportunity's current probability
- **Usage Example**:
  ```sql
  select public.move_opportunity_stage('<OPP_UUID>'::uuid,'<STAGE_UUID>'::uuid);
  ```

## Extensions
- **pg_trgm**: Enabled for trigram text search capabilities

## Technical Implementation

- **PostgreSQL Extensions**: Uses `pg_trgm` for full-text search on opportunity names
- **Audit System**: Automatic change tracking with timestamps and user identification
- **RLS Security**: Role-based access control at the database level with DROP/CREATE pattern for policies
- **Indexing Strategy**: Optimized for common query patterns (owner, stage, close date, amount)
- **Data Integrity**: Foreign key constraints and proper data types
- **Policy Management**: Uses `DROP POLICY IF EXISTS` followed by `CREATE POLICY` to avoid syntax errors

## Next Steps

⚠️ **IMPORTANT**: This migration file must be reviewed and executed in the Supabase Dashboard SQL Editor AFTER thorough review.

### Execution Instructions:
1. Review the migration file thoroughly
2. Open Supabase Dashboard → SQL Editor
3. Copy and paste the contents of `supabase/migrations/2025-08-23-s3-opportunities.sql`
4. Execute the migration
5. Verify all tables, indexes, and policies are created successfully
6. Test RLS policies with different user roles

### Post-Migration Verification:
- [ ] Verify all 3 tables are created
- [ ] Confirm all indexes are present
- [ ] Test RLS policies for each role
- [ ] Verify audit trigger is working
- [ ] Check foreign key constraints

## Dependencies
- Requires existing `public.clients` table
- Requires existing `public.contacts` table
- Requires existing `public.profiles` table with role field
- Requires existing `public.audit_logs` table
- Requires existing `auth.users` table (Supabase built-in)

## Risk Assessment
- **Low Risk**: Migration uses `IF NOT EXISTS` clauses for safety
- **Rollback**: Can be reversed by dropping tables in reverse order
- **Data Loss**: No existing data affected (new tables only)

---
*Generated for Sprint 3 - Opportunities & Pipeline Management*