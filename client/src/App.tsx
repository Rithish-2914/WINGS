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
import SampleSubmission from "@/pages/executive/SampleSubmission";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navigation />
      <main>
        <Switch>
          <Route path="/" component={LoginPage} />
          
          {/* Executive Routes */}
          <ProtectedRoute 
            path="/dashboard" 
            component={ExecutiveDashboard} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/visits/new" 
            component={VisitForm} 
            roles={['executive', 'admin']} 
          />
          <ProtectedRoute 
            path="/visits/history" 
            component={History} 
            roles={['executive', 'admin']} 
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
