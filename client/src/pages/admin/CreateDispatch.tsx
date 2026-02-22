import { useQuery } from "@tanstack/react-query";
import { User, Dispatch } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function CreateDispatch() {
  const [, setLocation] = useLocation();
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const executives = users?.filter(u => u.role === 'executive') || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Create Dispatch</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Executive</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an executive" />
                </SelectTrigger>
                <SelectContent>
                  {executives.map(exec => (
                    <SelectItem key={exec.id} value={exec.id.toString()}>{exec.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Input type="date" defaultValue="2026-02-21" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type of Books</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Sample">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Input defaultValue="SINDHU PARCEL SERVICE" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">LR No.</label>
              <Input defaultValue="KMN123456" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">No. Of Box</label>
              <Input type="number" defaultValue="1" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Ref</label>
              <Input placeholder="xyz school sample/order" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Remarks (Max 200 words)</label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border bg-background"
                placeholder="Enter remarks..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select defaultValue="Not Delivered">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full">Create Dispatch & Packing List</Button>
        </CardContent>
      </Card>
    </div>
  );
}
