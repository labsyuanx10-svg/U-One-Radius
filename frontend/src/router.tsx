import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/layout/AppShell"
import { Login } from "@/pages/Login"
import { Dashboard } from "@/pages/Dashboard"
import { CustomerList } from "@/pages/customers/CustomerList"
import { CustomerForm } from "@/pages/customers/CustomerForm"
import { CustomerDetail } from "@/pages/customers/CustomerDetail"
import { PlansView } from "@/pages/plans/PlansView"
import { RouterList } from "@/pages/routers/RouterList"
import { GroupList } from "@/pages/groups/GroupList"
import { TicketList } from "@/pages/tickets/TicketList"
import { TicketForm } from "@/pages/tickets/TicketForm"
import { TransactionList } from "@/pages/transactions/TransactionList"
import { InvoicePrint } from "@/pages/transactions/InvoicePrint"
import { StatusOnline } from "@/pages/radacct/StatusOnline"
import { LogRadius } from "@/pages/radacct/LogRadius"
import { SettingsView } from "@/pages/settings/SettingsView"
import { WaSettings } from "@/pages/settings/WaSettings"
import { AdminUsers } from "@/pages/settings/AdminUsers"
import { ActivityLog } from "@/pages/settings/ActivityLog"
import { ProfilePage } from "@/pages/settings/ProfilePage"
import { Infrastructure } from "@/pages/infrastructure/Infrastructure"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "customers", element: <CustomerList /> },
      { path: "customers/new", element: <CustomerForm /> },
      { path: "customers/:id", element: <CustomerDetail /> },
      { path: "customers/:id/edit", element: <CustomerForm /> },
      { path: "plans", element: <PlansView /> },
      { path: "routers", element: <RouterList /> },
      { path: "infrastructure", element: <Infrastructure /> },
      { path: "groups", element: <GroupList /> },
      { path: "tickets", element: <TicketList /> },
      { path: "tickets/new", element: <TicketForm /> },
      { path: "transactions", element: <TransactionList /> },
      { path: "transactions/:id/print", element: <InvoicePrint /> },
      { path: "radacct", element: <StatusOnline /> },
      { path: "radacct/logradius", element: <LogRadius /> },
      { path: "settings", element: <SettingsView /> },
      { path: "settings/wa", element: <WaSettings /> },
      { path: "admin-users", element: <AdminUsers /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "activity-log", element: <ActivityLog /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
