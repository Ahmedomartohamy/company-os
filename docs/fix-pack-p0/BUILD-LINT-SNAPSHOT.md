# Build & Lint Error Snapshot

**Generated:** 2025-01-27  
**Command:** `npm run typecheck && npm run build`  
**Total Errors:** 48 errors in 10 files  
**Exit Code:** 1  

## Error Summary by File

| File | Error Count | Primary Issues |
|------|-------------|----------------|
| src/lib/opportunities.ts | 1 | Property access on array type |
| src/modules/contacts/ContactDetails.tsx | 4 | Component prop mismatches |
| src/modules/contacts/ContactForm.tsx | 8 | Input component prop errors |
| src/modules/leads/ConvertLeadDialog.tsx | 2 | Form type mismatches |
| src/modules/leads/LeadForm.tsx | 9 | RBAC + Input prop errors |
| src/modules/leads/LeadsList.tsx | 11 | Component prop + type errors |
| src/modules/opportunities/OpportunitiesBoard.tsx | 1 | Component prop mismatch |
| src/modules/opportunities/OpportunityCard.tsx | 2 | Component prop errors |
| src/modules/opportunities/OpportunityDetails.tsx | 4 | Component prop mismatches |
| src/modules/opportunities/OpportunityForm.tsx | 6 | Input component prop errors |

## Full Error Log

```
> company-os@0.2.0 typecheck
> tsc --noEmit

src/lib/opportunities.ts:286:35 - error TS2339: Property 'name' does not exist on type '{ id: any; name: any; }[]'.

286       const stageName = opp.stage.name;
                                      ~~~~

src/modules/contacts/ContactDetails.tsx:87:9 - error TS2322: Type '{ title: string; description: string; action: Element; }' is not assignable to type 'IntrinsicAttributes & { title?: string | undefined; hint?: string | undefined; action?: ReactNode; }'.
  Property 'description' does not exist on type 'IntrinsicAttributes & { title?: string | undefined; hint?: string | undefined; action?: ReactNode; }'.

87         description="لم يتم العثور على جهة الاتصال المطلوبة"
           ~~~~~~~~~~~

src/modules/contacts/ContactDetails.tsx:108:9 - error TS2322: Type '{ children: Element; title: string; subtitle: string | undefined; }' is not assignable to type 'IntrinsicAttributes & { title: string; children?: ReactNode; }'.
  Property 'subtitle' does not exist on type 'IntrinsicAttributes & { title: string; children?: ReactNode; }'.

108         subtitle={contact.position || contact.company}
            ~~~~~~~~

src/modules/contacts/ContactDetails.tsx:283:13 - error TS2322: Type '{ title: string; description: string; action: Element; }' is not assignable to type 'IntrinsicAttributes & { title?: string | undefined; hint?: string | undefined; action?: ReactNode; }'.
  Property 'description' does not exist on type 'IntrinsicAttributes & { title?: string | undefined; hint?: string | undefined; action?: ReactNode; }'.

283             description="لا توجد فرص مرتبطة بجهة الاتصال هذه"
                ~~~~~~~~~~~

src/modules/contacts/ContactDetails.tsx:295:13 - error TS2322: Type '{ title: string; description: string; action: Element; }' is not assignable to type 'IntrinsicAttributes & { title?: string | undefined; hint?: string | undefined; action?: ReactNode; }'.
  Property 'description' does not exist on type 'IntrinsicAttributes & { title: string; description: string; action: Element; }'.

295             description="لا توجد عملاء محتملون مرتبطون بجهة الاتصال هذه"
                ~~~~~~~~~~~

src/modules/contacts/ContactForm.tsx:34:5 - error TS2322: Type '{ client_id?: number | undefined; contact_id?: number | undefined; first_name: string; last_name: string; email?: string | undefined; phone?: string | undefined; ... 4 more ...; notes?: string | undefined; }' is not assignable to type 'Partial<{ client_id: number; contact_id: number; first_name: string; last_name: string; email: string; phone: string; position: string; company: string; address: string; notes: string; }>'.
  Types of property 'client_id' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.

34     defaultValues: {
       ~~~~~~~~~~~~~

[Multiple similar Input component 'error' prop errors in ContactForm.tsx lines 175, 187, 199, 211, 223, 235, 247]

src/modules/leads/ConvertLeadDialog.tsx:38:5 - error TS2322: Type '{ client_id?: number | undefined; contact_id?: number | undefined; first_name: string; last_name: string; email?: string | undefined; phone?: string | undefined; ... 4 more ...; notes?: string | undefined; }' is not assignable to type 'Partial<{ client_id: number; contact_id: number; first_name: string; last_name: string; email: string; phone: string; position: string; company: string; address: string; notes: string; }>'.
  Types of property 'client_id' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.

38     defaultValues: {
       ~~~~~~~~~~~~~

[Similar error for contact_id at line 39]

src/modules/leads/LeadForm.tsx:31:5 - error TS2322: Type '{ client_id?: number | undefined; contact_id?: number | undefined; first_name: string; last_name: string; email?: string | undefined; phone?: string | undefined; ... 6 more ...; notes?: string | undefined; }' is not assignable to type 'Partial<{ client_id: number; contact_id: number; first_name: string; last_name: string; email: string; phone: string; ... 6 more ...; notes: string; }>'.
  Types of property 'client_id' are incompatible.
    Type 'number | undefined' is not assignable to type 'number'.

31     defaultValues: {
       ~~~~~~~~~~~~~

[RBAC errors in LeadForm.tsx:]
src/modules/leads/LeadForm.tsx:145:37 - error TS2345: Argument of type '"leads"' is not assignable to parameter of type 'Resource'.

145     if (isEditing && !can('update', 'leads', lead)) {
                                        ~~~~~~~

src/modules/leads/LeadForm.tsx:149:38 - error TS2345: Argument of type '"leads"' is not assignable to parameter of type 'Resource'.

149     if (!isEditing && !can('create', 'leads')) {
                                         ~~~~~~~

[Multiple Input component 'error' prop errors in LeadForm.tsx lines 171, 183, 195, 207, 219, 231]

[Multiple similar errors in LeadsList.tsx, OpportunitiesBoard.tsx, OpportunityCard.tsx, OpportunityDetails.tsx, and OpportunityForm.tsx following the same patterns]

Found 48 errors in 10 files.

Errors  Files
     1  src/lib/opportunities.ts:286
     4  src/modules/contacts/ContactDetails.tsx:87
     8  src/modules/contacts/ContactForm.tsx:34
     2  src/modules/leads/ConvertLeadDialog.tsx:38
     9  src/modules/leads/LeadForm.tsx:31
    11  src/modules/leads/LeadsList.tsx:43
     1  src/modules/opportunities/OpportunitiesBoard.tsx:309
     2  src/modules/opportunities/OpportunityCard.tsx:150
     4  src/modules/opportunities/OpportunityDetails.tsx:209
     6  src/modules/opportunities/OpportunityForm.tsx:44
```

## Error Pattern Analysis

### 1. Input Component Prop Errors (Most Common)
- **Pattern:** `Property 'error' does not exist on type 'IntrinsicAttributes & InputHTMLAttributes<HTMLInputElement>'`
- **Affected Files:** ContactForm.tsx, LeadForm.tsx, OpportunityForm.tsx
- **Root Cause:** Custom Input component expects `error` prop but TypeScript sees standard HTML input

### 2. Form DefaultValues Type Mismatches
- **Pattern:** `Type 'number | undefined' is not assignable to type 'number'`
- **Affected Properties:** `client_id`, `contact_id`
- **Root Cause:** Optional fields in form schema vs required in type definition

### 3. Component Prop Mismatches
- **Pattern:** Properties like `description`, `subtitle` don't exist on component types
- **Affected Files:** ContactDetails.tsx, OpportunityDetails.tsx
- **Root Cause:** Component interface definitions don't match usage

### 4. RBAC Type Errors
- **Pattern:** `Argument of type '"leads"' is not assignable to parameter of type 'Resource'`
- **Root Cause:** String literals not matching Resource union type

### 5. Array Property Access Error
- **Pattern:** `Property 'name' does not exist on type '{ id: any; name: any; }[]'`
- **File:** opportunities.ts:286
- **Root Cause:** Accessing property on array instead of array element
```