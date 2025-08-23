# TypeScript Build Fix Plan

**Generated:** 2025-01-27  
**Total Errors:** 48 errors in 10 files  
**Fix Strategy:** Surgical, minimal changes only  

## Fix Categories & Priority

### 🔴 HIGH PRIORITY - Component Interface Mismatches (25+ errors)

#### Pattern 1: Input Component `error` Prop Missing
**Root Cause:** Custom Input components expect `error` prop but TypeScript sees standard HTML input interface

**Files to Fix:**
- `src/modules/contacts/ContactForm.tsx:175,187,199,211,223,235,247` | Input prop error | Add `error?: string` to Input component interface
- `src/modules/leads/LeadForm.tsx:171,183,195,207,219,231` | Input prop error | Add `error?: string` to Input component interface  
- `src/modules/opportunities/OpportunityForm.tsx:176,187,198,209` | Input prop error | Add `error?: string` to Input component interface

**Surgical Fix:**
```typescript
// In src/components/ui/input.tsx (or wherever Input is defined)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}
```

#### Pattern 2: Component Prop Interface Mismatches
**Root Cause:** Components used with props not defined in their interfaces

**Files to Fix:**
- `src/modules/contacts/ContactDetails.tsx:87,283,295` | Missing `description` prop | Add `description?: string` to EmptyState component
- `src/modules/contacts/ContactDetails.tsx:108` | Missing `subtitle` prop | Add `subtitle?: string` to PageHeader component
- `src/modules/opportunities/OpportunityDetails.tsx:209,221,233` | Missing `description` prop | Add `description?: string` to EmptyState component
- `src/modules/opportunities/OpportunitiesBoard.tsx:309` | Missing `description` prop | Add `description?: string` to EmptyState component
- `src/modules/opportunities/OpportunityCard.tsx:150,162` | Component prop mismatch | Check component interface vs usage

**Surgical Fix:**
```typescript
// In EmptyState component definition
interface EmptyStateProps {
  title?: string;
  hint?: string;  // existing
  description?: string;  // ADD THIS
  action?: ReactNode;
}

// In PageHeader component definition  
interface PageHeaderProps {
  title: string;
  subtitle?: string;  // ADD THIS
  children?: ReactNode;
}
```

### 🟡 MEDIUM PRIORITY - Form Type Mismatches (8 errors)

#### Pattern 3: Optional vs Required Field Type Conflicts
**Root Cause:** Form schemas have optional `client_id`/`contact_id` but types expect required

**Files to Fix:**
- `src/modules/contacts/ContactForm.tsx:34` | `client_id` type mismatch | Make `client_id` optional in form type or handle undefined
- `src/modules/leads/ConvertLeadDialog.tsx:38,39` | `client_id`/`contact_id` type mismatch | Make fields optional in form type
- `src/modules/leads/LeadForm.tsx:31` | `client_id` type mismatch | Make `client_id` optional in form type

**Surgical Fix Option A (Recommended):**
```typescript
// In form defaultValues, provide fallback values
defaultValues: {
  client_id: contact?.client_id || 0,  // or appropriate default
  contact_id: contact?.id || 0,
  // ... other fields
}
```

**Surgical Fix Option B:**
```typescript
// Make form schema fields optional
type FormData = Partial<ContactFormData> & {
  first_name: string;
  last_name: string;
  // required fields stay required
}
```

### 🟡 MEDIUM PRIORITY - RBAC Type Errors (2 errors)

#### Pattern 4: Resource String Literal Type Mismatch
**Root Cause:** `'leads'` string not matching Resource union type

**Files to Fix:**
- `src/modules/leads/LeadForm.tsx:145` | RBAC resource type | Change `'leads'` to match Resource type or update Resource union
- `src/modules/leads/LeadForm.tsx:149` | RBAC resource type | Change `'leads'` to match Resource type or update Resource union

**Surgical Fix:**
```typescript
// Check src/lib/rbac.ts for correct Resource type
// If 'leads' should be valid, add to Resource union:
type Resource = 'projects' | 'tasks' | 'contacts' | 'leads' | 'opportunities';

// OR change usage to match existing Resource:
if (isEditing && !can('update', 'contacts', lead)) {  // if leads map to contacts
```

### 🟢 LOW PRIORITY - Data Access Errors (1 error)

#### Pattern 5: Array Property Access Error
**Root Cause:** Accessing property on array instead of array element

**Files to Fix:**
- `src/lib/opportunities.ts:286` | Array property access | Change `opp.stage.name` to `opp.stage[0]?.name` or fix data structure

**Surgical Fix:**
```typescript
// Line 286 in opportunities.ts
// BEFORE:
const stageName = opp.stage.name;

// AFTER (Option A - if stage is array):
const stageName = opp.stage[0]?.name || 'Unknown';

// AFTER (Option B - if stage should be object):
// Fix the data query/mapping to return object instead of array
```

## Implementation Order

### Phase 1: Component Interface Fixes (Highest Impact)
1. **Fix Input component interface** - Will resolve 15+ errors immediately
2. **Fix EmptyState component interface** - Will resolve 6+ errors
3. **Fix PageHeader component interface** - Will resolve 1+ error

### Phase 2: Form Type Fixes
1. **Fix form defaultValues type conflicts** - 4 errors
2. **Handle optional field types** - 4 errors

### Phase 3: RBAC & Data Access
1. **Fix RBAC Resource type** - 2 errors
2. **Fix array property access** - 1 error

## Validation Steps

1. After each phase, run: `npm run typecheck`
2. Verify error count decreases as expected
3. Run: `npm run build` to ensure no build-specific errors
4. Test affected components in browser to ensure no runtime errors

## Risk Assessment

- **Low Risk:** Component interface additions (adding optional props)
- **Medium Risk:** Form type changes (could affect form validation)
- **Low Risk:** RBAC type fixes (string literal changes)
- **Medium Risk:** Data access fixes (could affect runtime behavior)

## Files That Need Component Interface Definitions

**Priority Search Targets:**
- `src/components/ui/input.tsx` - For Input component interface
- `src/components/common/EmptyState.tsx` - For EmptyState interface
- `src/components/common/PageHeader.tsx` - For PageHeader interface
- `src/lib/rbac.ts` - For Resource type definition

**Note:** If component files don't exist in expected locations, search codebase for component definitions before implementing fixes.