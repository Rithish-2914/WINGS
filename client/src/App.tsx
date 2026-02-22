import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";

import LoginPage from "@/pages/LoginPage";
import ExecutiveDashboard from "@/pages/executive/Dashboard";
import VisitForm from "@/pages/executive/VisitForm";
import History from "@/pages/executive/History";
import LeaveApplication from "@/pages/executive/LeaveApplication";
import SampleSubmission from "@/pages/executive/SampleSubmission";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLeaves from "@/pages/admin/AdminLeaves";
import AdminOrders from "@/pages/admin/AdminOrders";
import NotFound from "@/pages/not-found";

import OrderForm from "@/pages/OrderForm";
import PublicOrderForm from "@/pages/PublicOrderForm";
import OrderHistory from "@/pages/executive/OrderHistory";
import OrderSupport from "@/pages/executive/OrderSupport";
import CreateDispatch from "@/pages/admin/CreateDispatch";
import DispatchInfo from "@/pages/executive/DispatchInfo";

// ... existing imports ...

function Router() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navigation />
      <main>
        <Switch>
          <Route path="/" component={LoginPage} />
          <Route path="/orders/public/:token">
            {(params) => <PublicOrderForm />}
          </Route>
          
          {/* Executive Routes */}
          <ProtectedRoute 
            path="/dashboard" 
            component={ExecutiveDashboard} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/orders/new" 
            component={OrderForm} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/orders" 
            component={OrderHistory} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/support" 
            component={OrderSupport} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/orders/dispatch/:id" 
            component={DispatchInfo} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/admin/dispatch/new" 
            component={CreateDispatch} 
            roles={['admin']} 
          />
          <ProtectedRoute 
            path="/visits/new" 
            component={VisitForm} 
            roles={['executive', 'admin']} 
          />
// ... rest of the routes ...
          <ProtectedRoute 
            path="/visits/history" 
            component={History} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/leaves" 
            component={LeaveApplication} 
            roles={['executive']} 
          />
          <ProtectedRoute 
            path="/samples/new" 
            component={SampleSubmission} 
            roles={['executive', 'admin']} 
          />
          
          {/* Admin Routes */}
          <ProtectedRoute 
            path="/admin" 
            component={AdminDashboard} 
            roles={['admin']} 
          />
          <ProtectedRoute 
            path="/admin/leaves" 
            component={AdminLeaves} 
            roles={['admin']} 
          />
          <ProtectedRoute 
            path="/admin/orders" 
            component={AdminOrders} 
            roles={['admin']} 
          />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
