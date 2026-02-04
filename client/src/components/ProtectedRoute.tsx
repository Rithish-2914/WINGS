import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  component: Component,
  path,
  roles = [],
}: {
  component: React.ComponentType<any>;
  path: string;
  roles?: string[];
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/" />;
        }

        if (roles.length > 0 && !roles.includes(user.role)) {
          // Redirect to appropriate dashboard based on actual role
          return <Redirect to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
        }

        return <Component {...params} />;
      }}
    </Route>
  );
}
