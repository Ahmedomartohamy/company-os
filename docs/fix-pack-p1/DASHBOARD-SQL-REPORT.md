# Dashboard KPI Views SQL Report

This report documents the KPI views created in migration `2025-08-23-p1-dashboard.sql` for the dashboard functionality.

## Overview

Four KPI views have been created to provide key performance indicators for the dashboard:

1. **Pipeline Value** - Total value of open opportunities
2. **Expected Revenue** - Weighted revenue based on probability
3. **Leads by Source** - Lead distribution by source (last 30 days)
4. **Tasks Due** - Tasks due today and tomorrow

## View Details

### 1. v_kpi_pipeline_value

**Purpose**: Calculates the total value of all open opportunities in the pipeline.

**Description**: Sums the `amount` field from all opportunities with status 'open'. Uses `COALESCE` to return 0 if no open opportunities exist.

**Test Query**:

```sql
SELECT * FROM public.v_kpi_pipeline_value;
```

**Expected Output**:

```
pipeline_value
--------------
     150000.00
```

### 2. v_kpi_expected_revenue

**Purpose**: Calculates expected revenue by weighting opportunity amounts with their probability percentages.

**Description**: Multiplies each opportunity's `amount` by its `probability` (converted to decimal). Ensures probability is between 0-100% using `GREATEST` and `LEAST` functions.

**Test Query**:

```sql
SELECT * FROM public.v_kpi_expected_revenue;
```

**Expected Output**:

```
expected_revenue
----------------
      75000.00
```

### 3. v_kpi_leads_by_source_30d

**Purpose**: Shows lead distribution by source for the last 30 days.

**Description**: Groups leads by `source` field and counts occurrences for leads created in the last 30 days. Results are ordered by count (descending).

**Test Query**:

```sql
SELECT * FROM public.v_kpi_leads_by_source_30d;
```

**Expected Output**:

```
   source    | cnt
-------------+-----
 Website     |  25
 Referral    |  18
 Cold Call   |  12
 Social Media|   8
```

### 4. v_kpi_tasks_due

**Purpose**: Counts tasks due today and tomorrow for workload planning.

**Description**: Uses conditional aggregation with `CASE` statements to count tasks due on `current_date` and `current_date + 1`.

**Test Query**:

```sql
SELECT * FROM public.v_kpi_tasks_due;
```

**Expected Output**:

```
due_today | due_tomorrow
----------+-------------
        5 |           3
```

## Usage Notes

- All views use `COALESCE` or conditional logic to handle null/empty results gracefully
- Views are created with `OR REPLACE` to allow safe re-execution
- The migration is wrapped in `BEGIN/COMMIT` for transactional safety
- Views are created in the `public` schema for accessibility

## Testing Recommendations

1. Run each test query individually to verify view functionality
2. Check that views return expected data types and handle edge cases (no data)
3. Verify performance with larger datasets if needed
4. Test that views update correctly when underlying data changes

## Dependencies

These views depend on the following tables:

- `public.opportunities` (status, amount, probability fields)
- `public.leads` (source, created_at fields)
- `public.tasks` (due_date field)

Ensure these tables exist and have the required columns before running the migration.
