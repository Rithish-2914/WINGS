import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { Loader2, CheckCircle2, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function OrderSupport() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: order, isLoading: isLoadingOrder } = useQuery<Order>({
    queryKey: [`/api/orders/${id}`],
  });

  const itemsList = [
    "Kinder Box 1.0",
    "Kinder Box Plus 2.0",
    "Kinder Play",
    "Little Steps",
    "Special Edition",
    "Play Group",
    "Wings – Semester",
    "General – Books"
  ];

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/orders")}>Back</Button>
        <h1 className="text-3xl font-bold">Order Support</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details: {order?.schoolName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {itemsList.map((item) => (
              <div key={item} className="flex items-center space-x-2 border p-3 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (Max 250 words)</label>
            <textarea 
              className="w-full min-h-[150px] p-3 rounded-md border bg-background"
              placeholder="Enter your support request details..."
              maxLength={1500}
            />
          </div>

          <Button className="w-full">Submit Request</Button>
        </CardContent>
      </Card>
    </div>
  );
}
