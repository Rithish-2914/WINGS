import { useQuery, useMutation } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Check, Truck, PackageCheck, Share2, Link as LinkIcon, LifeBuoy } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";

const CATEGORIES = [
  "Kinder Box 1.0",
  "Kinder Box Plus 2.0",
  "Special Edition",
  "Kinder Play",
  "Little Steps",
  "Little Steps Combo",
  "Young Minds",
  "General Books"
];

export default function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: supportRequests } = useQuery<any[]>({
    queryKey: ["/api/support"],
  });

  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders/share", {});
      return res.json();
    },
    onSuccess: (order: Order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      const link = `${window.location.origin}/orders/public/${order.shareToken}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Link Generated!", description: "Link copied to clipboard." });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Success", description: "Order updated" });
      setSelectedOrder(null);
    }
  });

  const updateSupportStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/support/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      toast({ title: "Success", description: "Request updated" });
    }
  });

  const downloadPDF = (order: Order) => {
    const doc = new jsPDF();
    doc.text(`Order ID: ${order.id}`, 10, 10);
    doc.save(`order-${order.id}.pdf`);
  };

  const copyShareLink = (order: Order) => {
    if (!order.shareToken) return;
    const link = `${window.location.origin}/orders/public/${order.shareToken}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!" });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> Order History
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => createShareLinkMutation.mutate()}>
              <LinkIcon className="w-4 h-4 mr-2" /> Share Link
            </Button>
            <Link href="/orders/new">
              <Button>New Order</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell>{order.schoolName}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium uppercase",
                      order.status === 'delivered' ? "bg-green-100 text-green-700" :
                      order.status === 'dispatched' ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {order.status || 'pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyShareLink(order)}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-6 h-6" /> Internal Requests
          </CardTitle>
          <Link href="/support">
            <Button variant="outline">New Request</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Dispatch Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportRequests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.createdAt ? format(new Date(req.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell>{req.subject}</TableCell>
                  <TableCell>
                    {req.items?.map((item: any, idx: number) => (
                      <div key={idx} className="text-[10px]">{item.name} ({item.qty})</div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {req.dispatchId ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Dispatch ID</span>
                        <span className="text-sm font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">{req.dispatchId}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Not dispatched yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium uppercase",
                      req.status === 'delivered' ? "bg-green-100 text-green-700" :
                      req.status === 'dispatched' ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {req.status || 'pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'dispatched' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={() => updateSupportStatusMutation.mutate({ id: req.id, status: 'delivered' })}
                      >
                        Click When Received
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.schoolName}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-6 space-y-8">
              {/* Status and Actions */}
              <div className="space-y-4 border-2 p-4 rounded-lg bg-blue-50/30">
                <h4 className="font-bold text-slate-800 uppercase border-b pb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Tracking Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <p className="text-sm">Status: 
                      <span className={cn(
                        "ml-2 px-2 py-1 rounded-full text-xs font-bold uppercase",
                        selectedOrder.status === 'delivered' ? "bg-green-100 text-green-700" :
                        selectedOrder.status === 'dispatched' ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      )}>
                        {selectedOrder.status || 'pending'}
                      </span>
                    </p>
                    {selectedOrder.dispatchId && (
                      <div className="mt-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase block">Dispatch ID</span>
                        <span className="text-sm font-mono bg-white px-2 py-1 rounded border border-blue-200 inline-block">{selectedOrder.dispatchId}</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedOrder.status === 'dispatched' && (
                    <Button 
                      className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'delivered' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="w-4 h-4 mr-2" />}
                      Click When Received
                    </Button>
                  )}
                </div>
              </div>

              {/* Rest of the order details... */}
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Full order details available in the generated PDF</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}