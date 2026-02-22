import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, MessageSquare } from "lucide-react";
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
      const res = await apiRequest("POST", "/api/support", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      toast({ title: "Success", description: "Request sent to admin" });
      setLocation("/");
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
    mutation.mutate({
      subject,
      items: selectedItems,
      remarks,
      status: "pending"
    });
  };

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Items/Products (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {itemsList.map((item) => (
                <div 
                  key={item} 
                  onClick={() => toggleItem(item)}
                  className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer transition-colors ${
                    selectedItems.includes(item) ? "bg-primary/10 border-primary" : "hover:bg-accent"
                  }`}
                >
                  <CheckCircle2 className={`h-5 w-5 ${selectedItems.includes(item) ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (Max 250 words)</label>
            <Textarea 
              className="min-h-[150px]"
              placeholder="Describe your requirements in detail..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={1500}
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
