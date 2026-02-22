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
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium uppercase",
                      req.status === 'delivered' ? "bg-green-100 text-green-700" :
                      req.status === 'dispatched' ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {req.status || 'pending'}
                    </span>
                    {req.dispatchId && <div className="text-[10px] text-blue-600">ID: {req.dispatchId}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'dispatched' && (
                      <Button size="sm" onClick={() => updateSupportStatusMutation.mutate({ id: req.id, status: 'delivered' })}>
                        Delivered
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
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded">
                <div>Status: {selectedOrder.status}</div>
                {selectedOrder.status === 'dispatched' && (
                  <Button onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'delivered' })}>
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}