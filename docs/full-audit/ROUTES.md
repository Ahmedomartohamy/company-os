# Route Mapping & Protection Analysis

## Public Routes

- `/login` → Login component (src/app/routes/Login.tsx)
- `*` → NotFound component (src/app/NotFound.tsx)

## Protected Routes (require authentication)

All routes below are wrapped in ProtectedRoute and AppShell:

- `/` → Dashboard (src/app/routes/Dashboard.tsx)
- `/clients` → ClientsPage (src/app/routes/Clients.tsx)
- `/contacts` → ContactsList (src/modules/contacts/ContactsList.tsx)
- `/contacts/:id` → ContactDetails (src/modules/contacts/ContactDetails.tsx)
- `/leads` → LeadsList (src/modules/leads/LeadsList.tsx)
- `/pipeline/:pipelineId` → OpportunitiesBoard (src/modules/opportunities/OpportunitiesBoard.tsx)
- `/opportunities/:id` → OpportunityDetails (src/modules/opportunities/OpportunityDetails.tsx)
- `/pipeline-debug` → PipelineDebug (src/pages/PipelineDebug.tsx)
- `/projects` → ProjectsPage (src/app/routes/Projects.tsx)
- `/tasks` → TasksPage (src/app/routes/Tasks.tsx)
- `/debug` → Debug (src/pages/Debug.tsx)

## Nested Routes

- All protected routes are nested under ProtectedRoute (`/`) using React Router's Outlet pattern
- Each protected route is wrapped in AppShell for consistent layout

## Route Protection Mechanism

- **Primary Protection**: ProtectedRoute component (src/app/ProtectedRoute.tsx)
  - Uses `useAuth()` hook from AuthProvider
  - Checks `loading` state and `session` existence
  - Redirects to `/login` if no session
  - Shows loading state during authentication check
- **No Role-Based Routing**: Routes are only protected by authentication, not by user roles
- **Redirect Behavior**: Unauthenticated users are redirected to `/login` with `replace` flag

---

_Format: path → component (protection status)_
