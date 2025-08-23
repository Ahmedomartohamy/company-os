# Sprint 3 Seed Data Report

## Overview

This report documents the seed data for Sprint 3's pipeline and opportunities system, providing a foundation for manual testing and development.

## Seed File

- **File**: `supabase/SEED_PIPELINE.sql`
- **Purpose**: Create default pipeline with standard sales stages for testing
- **Dependencies**: Requires the main migration (`2025-08-23-s3-opportunities.sql`) to be executed first

## Seed Data Structure

### Default Sales Pipeline

The seed creates a single pipeline named "Default Sales" with four standard sales stages:

| Stage          | Position | Probability | Description                         |
| -------------- | -------- | ----------- | ----------------------------------- |
| Qualification  | 1        | 10%         | Initial lead qualification phase    |
| Needs Analysis | 2        | 30%         | Understanding customer requirements |
| Proposal       | 3        | 60%         | Formal proposal presentation        |
| Negotiation    | 4        | 90%         | Final negotiations and closing      |

### Technical Implementation

- Uses PostgreSQL `DO` block for proper variable handling
- Declares `p_id` variable to capture the pipeline UUID
- Inserts pipeline first, then uses returned ID for stages
- Includes `RAISE NOTICE` statements for execution feedback
- Handles percentage symbols properly in notice messages

## Execution Instructions

### Prerequisites

1. Main migration must be executed first:
   - `supabase/migrations/2025-08-23-s3-opportunities.sql`
2. Verify tables exist: `pipelines`, `stages`, `opportunities`
3. Ensure RLS policies are active

### Running the Seed

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/SEED_PIPELINE.sql`
3. Execute the script
4. Verify success messages in output:
   - Pipeline creation confirmation with UUID
   - Stage creation summary

### Expected Output

```
NOTICE: Pipeline "Default Sales" created with ID: [UUID]
NOTICE: Created 4 stages: Qualification (10%), Needs Analysis (30%), Proposal (60%), Negotiation (90%)
```

## Verification Queries

After running the seed, verify data with these queries:

```sql
-- Check pipeline creation
SELECT * FROM public.pipelines WHERE name = 'Default Sales';

-- Check stages creation
SELECT s.name, s.position, s.probability
FROM public.stages s
JOIN public.pipelines p ON s.pipeline_id = p.id
WHERE p.name = 'Default Sales'
ORDER BY s.position;

-- Count total stages
SELECT COUNT(*) as stage_count
FROM public.stages s
JOIN public.pipelines p ON s.pipeline_id = p.id
WHERE p.name = 'Default Sales';
```

## Testing Scenarios

With this seed data, you can test:

1. **Pipeline Management**:
   - View existing pipelines
   - Create new pipelines
   - Modify pipeline names

2. **Stage Management**:
   - View stages within pipeline
   - Reorder stages (position changes)
   - Modify stage probabilities
   - Add/remove stages

3. **Opportunity Management**:
   - Create opportunities in different stages
   - Move opportunities between stages
   - Test `move_opportunity_stage()` RPC function
   - Verify probability updates

4. **RLS Testing**:
   - Test access with different user roles
   - Verify Admin/Sales Manager can modify pipelines
   - Confirm Sales Reps can create opportunities

## Cleanup (Optional)

To remove seed data for fresh testing:

```sql
-- Remove all opportunities (if any created during testing)
DELETE FROM public.opportunities WHERE pipeline_id IN (
    SELECT id FROM public.pipelines WHERE name = 'Default Sales'
);

-- Remove stages
DELETE FROM public.stages WHERE pipeline_id IN (
    SELECT id FROM public.pipelines WHERE name = 'Default Sales'
);

-- Remove pipeline
DELETE FROM public.pipelines WHERE name = 'Default Sales';
```

## Notes

- Seed data is designed for development and testing only
- Production environments should create pipelines through the application UI
- The seed uses standard sales terminology but can be customized
- Stage probabilities follow common sales funnel patterns

---

_Generated for Sprint 3 - Pipeline Seed Data_
