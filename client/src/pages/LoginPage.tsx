import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Briefcase } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const loginMutation = useLogin();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20"></div>

      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Master Brains" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sales Field Reporting
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your ID (e.g., admin or executive)" 
                        {...field} 
                        className="h-11 bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                        className="h-11 bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-11 mt-2 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-4 text-center text-sm text-muted-foreground border-t pt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Sales Executive Usage Guide</h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-left">
              <div className="flex items-start gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</span>
                <span>Log in with your assigned ID and password.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</span>
                <span>Click "New Visit Entry" to record a school visit.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</span>
                <span>Ensure your GPS is enabled to capture location proof automatically.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">4</span>
                <span>Upload a live photo of the school or meeting to verify your visit.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">5</span>
                <span>Check your history for admin follow-ups and remarks.</span>
              </div>
            </div>
          </div>
          <p className="mt-4 opacity-50">Protected System • Authorized Personnel Only</p>
        </CardFooter>
      </Card>
    </div>
  );
}
