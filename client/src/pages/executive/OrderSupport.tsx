import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function OrderSupport() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<{ name: string; qty: number }[]>([]);

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

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        items: items.map((item, index) => ({ 
          id: index + 1, 
          name: item.name, 
          qty: item.qty 
        }))
      };
      console.log("Submitting support request payload:", payload);
      const res = await apiRequest("POST", "/api/support", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      toast({ title: "Success", description: "Request sent to admin" });
      setLocation("/orders"); 
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const handleSubmit = () => {
    if (!subject) {
      toast({ variant: "destructive", title: "Required", description: "Please enter a subject" });
      return;
    }
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Required", description: "Please add at least one item" });
      return;
    }
    mutation.mutate({
      subject,
      remarks,
      status: "pending"
    });
  };

  const updateItemQty = (name: string, qty: number) => {
    setItems(prev => {
      const existing = prev.find(i => i.name === name);
      if (existing) {
        if (qty <= 0) return prev.filter(i => i.name !== name);
        return prev.map(i => i.name === name ? { ...i, qty } : i);
      }
      if (qty <= 0) return prev;
      return [...prev, { name, qty }];
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/")}>Back</Button>
        <h1 className="text-3xl font-bold">Internal Request</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Request to Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input 
              placeholder="What is this request about?" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Items & Quantities</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemsList.map((itemName) => {
                const selected = items.find(i => i.name === itemName);
                return (
                  <div key={itemName} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm font-medium">{itemName}</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateItemQty(itemName, (selected?.qty || 0) - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{selected?.qty || 0}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateItemQty(itemName, (selected?.qty || 0) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks</label>
            <Textarea 
              className="min-h-[120px]"
              placeholder="Describe your requirements in detail..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Request to Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}