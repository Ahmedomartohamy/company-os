import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { AppShell } from "./layout/AppShell";
import Dashboard from "./routes/Dashboard";
import ClientsPage from "./routes/Clients";
import ProjectsPage from "./routes/Projects";
import TasksPage from "./routes/Tasks";
import Login from "./routes/Login";
import NotFound from "./NotFound";
import ProtectedRoute from "./ProtectedRoute";
import Debug from "../pages/Debug";
import { ContactsList, ContactDetails } from "../modules/contacts";
import { LeadsList } from "../modules/leads";

export default function AppRouter(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<AppShell><Dashboard /></AppShell>} />
          <Route path={ROUTES.dashboard} element={<AppShell><Dashboard /></AppShell>} />
          <Route path={ROUTES.clients} element={<AppShell><ClientsPage /></AppShell>} />
          <Route path={ROUTES.contacts} element={<AppShell><ContactsList /></AppShell>} />
          <Route path="/contacts/:id" element={<AppShell><ContactDetails /></AppShell>} />
          <Route path={ROUTES.leads} element={<AppShell><LeadsList /></AppShell>} />
          <Route path={ROUTES.projects} element={<AppShell><ProjectsPage /></AppShell>} />
          <Route path={ROUTES.tasks} element={<AppShell><TasksPage /></AppShell>} />
          <Route path={ROUTES.debug} element={<AppShell><Debug /></AppShell>} />
        </Route>
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
}
