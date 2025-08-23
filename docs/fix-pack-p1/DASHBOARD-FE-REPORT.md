# Dashboard Frontend Integration Report

## Overview

This report documents the frontend integration of dashboard KPI views with TanStack Query, replacing static values with dynamic data from Supabase views.

## Files Modified

### 1. `src/lib/dashboard.ts` (NEW)

**Purpose**: Data fetching functions for dashboard KPIs

**Functions Created**:

- `getPipelineValue()`: Fetches total pipeline value from `v_kpi_pipeline_value`
- `getExpectedRevenue()`: Fetches expected revenue from `v_kpi_expected_revenue`
- `getLeadsBySource30d()`: Fetches leads by source from `v_kpi_leads_by_source_30d`
- `getTasksDue()`: Fetches due tasks from `v_kpi_tasks_due`

**Error Handling**: Each function throws descriptive errors for proper error boundaries

**Type Safety**: Includes TypeScript interfaces for all return types

### 2. `src/app/routes/Dashboard.tsx` (MODIFIED)

**Changes Made**:

- Added TanStack Query imports and dashboard function imports
- Replaced static KPI values with dynamic queries
- Added loading states ("..." indicator)
- Added error states ("—" fallback with toast notifications)
- Preserved Arabic labels and existing layout
- Added currency formatting for monetary values
- Updated KPI labels to match actual data being displayed

**New KPI Cards**:

1. **قيمة البايبلاين** (Pipeline Value) - Shows total open opportunities value
2. **الإيراد المتوقع** (Expected Revenue) - Shows weighted expected revenue
3. **مهام اليوم** (Today's Tasks) - Shows tasks due today
4. **مهام الغد** (Tomorrow's Tasks) - Shows tasks due tomorrow

## Query Keys Structure

### Dashboard Queries

```typescript
// Query keys used in the dashboard
['dashboard', 'pipeline-value'][('dashboard', 'expected-revenue')][('dashboard', 'tasks-due')][ // Pipeline value KPI // Expected revenue KPI // Tasks due KPI
  ('dashboard', 'leads-by-source')
]; // Leads by source KPI (not yet implemented)
```

## Query Invalidation Strategy

### When to Invalidate Dashboard Queries

#### Pipeline Value (`['dashboard', 'pipeline-value']`)

**Invalidate after**:

- Creating new opportunities
- Updating opportunity amount/probability
- Changing opportunity status (especially closing)
- Deleting opportunities

**Implementation locations**:

- `src/modules/opportunities/` - After CRUD operations
- Opportunity form submissions
- Status change actions

#### Expected Revenue (`['dashboard', 'expected-revenue']`)

**Invalidate after**:

- Same triggers as pipeline value (uses same data with probability weighting)
- Updating opportunity probability specifically

#### Tasks Due (`['dashboard', 'tasks-due']`)

**Invalidate after**:

- Creating new tasks
- Updating task due dates
- Completing/marking tasks as done
- Deleting tasks

**Implementation locations**:

- Task management modules
- Task form submissions
- Task status updates

#### Leads by Source (`['dashboard', 'leads-by-source']`)

**Invalidate after**:

- Creating new leads/contacts
- Updating lead source information
- Converting leads to opportunities

### Recommended Invalidation Implementation

```typescript
// Example: After opportunity creation/update
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate relevant dashboard queries
queryClient.invalidateQueries({ queryKey: ['dashboard', 'pipeline-value'] });
queryClient.invalidateQueries({ queryKey: ['dashboard', 'expected-revenue'] });
```

## Error Handling

### Loading States

- Display "..." while queries are loading
- Maintain responsive layout during loading

### Error States

- Display "—" as fallback value when queries fail
- Show Arabic error toast notifications
- Graceful degradation - other KPIs continue to work

### Error Messages (Arabic)

- Pipeline: "خطأ في تحميل قيمة البايبلاين"
- Revenue: "خطأ في تحميل الإيراد المتوقع"
- Tasks: "خطأ في تحميل المهام المستحقة"

## Performance Considerations

### Query Configuration

- Queries run in parallel for faster loading
- Consider adding `staleTime` for less frequent refetching
- Consider adding `refetchInterval` for real-time updates

### Potential Optimizations

```typescript
// Example: Add stale time to reduce unnecessary refetches
useQuery({
  queryKey: ['dashboard', 'pipeline-value'],
  queryFn: getPipelineValue,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 10 * 60 * 1000, // 10 minutes
});
```

## Testing Recommendations

### Unit Tests

- Test each dashboard function with mock Supabase responses
- Test error handling scenarios
- Test loading states in components

### Integration Tests

- Test query invalidation after CRUD operations
- Test error boundaries and fallback states
- Test Arabic text rendering and formatting

### Manual Testing

- Verify currency formatting displays correctly
- Test loading states by throttling network
- Test error states by disconnecting from database
- Verify Arabic labels display properly

## Dependencies

### Required Packages

- `@tanstack/react-query` - Query management
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `@supabase/supabase-js` - Database client

### Database Dependencies

- Requires SQL views from `2025-08-23-p1-dashboard.sql`
- Depends on proper RLS policies for view access
- Requires `opportunities`, `tasks`, and `contacts` tables

## Future Enhancements

### Potential Additions

1. **Real-time Updates**: Add Supabase real-time subscriptions
2. **Caching Strategy**: Implement more sophisticated caching
3. **Leads by Source**: Complete implementation of leads KPI
4. **Date Range Filters**: Allow users to filter KPIs by date range
5. **Export Functionality**: Add ability to export KPI data

### Performance Monitoring

- Monitor query performance in production
- Track error rates and user experience
- Consider implementing query retries for transient failures

## Conclusion

The dashboard has been successfully integrated with dynamic data from Supabase views. The implementation includes proper error handling, loading states, and maintains the existing Arabic interface. Query invalidation strategy is documented for future implementation across the application.
