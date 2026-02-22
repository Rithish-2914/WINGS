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
    try {
      const doc = new jsPDF();
      const margin = 15;
      let yPos = 20;

      // Helper for sections
      const addSection = (title: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, yPos);
        yPos += 7;
        doc.line(margin, yPos - 5, 195, yPos - 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      };

      const addField = (label: string, value: any) => {
        const textValue = String(value || "-");
        doc.text(`${label}: ${textValue}`, margin, yPos);
        yPos += 6;
      };

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("MASTER BRAINS", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Order ID: ${order.id} | Date: ${order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}`, 105, 22, { align: "center" });
      doc.setTextColor(0);
      yPos = 35;

      // 1. Office Use & Mode
      addSection("OFFICE USE & MODE");
      addField("Executive", order.userName || `ID: ${order.userId}`);
      addField("School Code", order.schoolCode);
      addField("School Name (Office)", order.schoolNameOffice);
      addField("Place", order.placeOffice);
      addField("Mode of Order", order.modeOfOrder);
      addField("Mode of Supply", order.modeOfSupply);
      addField("School Order Copy", order.hasSchoolOrderCopy ? "Yes" : "No");
      addField("Distributor Order Copy", order.hasDistributorOrderCopy ? "Yes" : "No");
      yPos += 5;

      // 2. School Information
      addSection("SCHOOL INFORMATION");
      addField("School Name", order.schoolName);
      addField("Trust Name", order.trustName);
      addField("Board", order.board);
      addField("School Type", order.schoolType);
      addField("Address", order.address);
      addField("Pincode", order.pincode);
      addField("State", order.state);
      addField("Email", order.emailId);
      addField("Phone", order.schoolPhone);
      yPos += 5;

      // 3. Contact Details
      addSection("CONTACT DETAILS");
      addField("Correspondent", order.correspondentName);
      addField("Correspondent Mobile", order.correspondentMobile);
      addField("Principal", order.principalName);
      addField("Principal Mobile", order.principalMobile);
      addField("Accounts", order.accountsName);
      addField("Accounts Mobile", order.accountsMobile);
      addField("Programme In Charge", order.programmeInChargeName);
      addField("Programme In Charge Mobile", order.programmeInChargeMobile);
      yPos += 5;

      // 4. Dispatch Details
      addSection("DISPATCH DETAILS");
      addField("Delivery Date", order.deliveryDate ? format(new Date(order.deliveryDate), "dd MMM yyyy") : "-");
      addField("Transport 1", order.preferredTransport1);
      addField("Transport 2", order.preferredTransport2);
      yPos += 10;

      // 5-11. Items Tables
      const items = (order.items || {}) as Record<string, any>;
      CATEGORIES.forEach(category => {
        const categoryItems = Object.entries(items)
          .filter(([key]) => key.startsWith(`${category}-`) && !key.endsWith("-discount"))
          .map(([key, value]) => {
            const productName = key.substring(category.length + 1);
            return [productName, String(value.price || "0"), String(value.qty || "0"), (Number(value.price || 0) * Number(value.qty || 0)).toFixed(2)];
          });

        if (categoryItems.length > 0) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(category.toUpperCase(), margin, yPos);
          yPos += 5;

          (doc as any).autoTable({
            startY: yPos,
            head: [["Product", "Price", "Qty", "Total"]],
            body: categoryItems,
            margin: { left: margin },
            theme: 'striped',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105] }
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });

      // 12. Totals
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      addSection("ESTIMATED INVOICE SUMMARY");
      addField("Gross Total", order.totalAmount);
      addField("Discount", order.discount || "0");
      addField("Total Discount", order.totalDiscount);
      doc.setFont("helvetica", "bold");
      addField("NET AMOUNT", order.netAmount);
      doc.setFont("helvetica", "normal");
      yPos += 5;
      addField("Advance Payment", order.advancePayment);
      addField("First Instalment", order.firstInstalment);
      addField("Second Instalment", order.secondInstalment);

      doc.save(`order-${(order.schoolName || 'order').replace(/[^a-z0-9]/gi, '_')}-${order.id}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF" });
    }
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
                    <Button variant="outline" size="sm" onClick={() => downloadPDF(order)}>
                      <Download className="w-4 h-4" />
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
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-black text-slate-800 border-b pb-4 flex justify-between items-center">
              <span>Order Details - {selectedOrder?.schoolName}</span>
              {selectedOrder && (
                <Button variant="outline" size="sm" onClick={() => downloadPDF(selectedOrder)}>
                  <Download className="w-4 h-4 mr-2" /> Download Summary PDF
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-0 overflow-y-auto max-h-[80vh]">
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
                        {updateStatusMutation.isPending ? "Updating..." : <><PackageCheck className="w-4 h-4 mr-2" /> Click When Received</>}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Office Use & Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-2 p-4 rounded-lg bg-slate-50">
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 uppercase text-sm border-b pb-1">Office Use Only</h4>
                    <p className="text-sm">School Code: <span className="font-medium">{selectedOrder.schoolCode || "-"}</span></p>
                    <p className="text-sm">School Name: <span className="font-medium">{selectedOrder.schoolNameOffice || "-"}</span></p>
                    <p className="text-sm">Place: <span className="font-medium">{selectedOrder.placeOffice || "-"}</span></p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 uppercase text-sm border-b pb-1">Order Mode</h4>
                    <p className="text-sm">Order: <span className="font-medium">{selectedOrder.modeOfOrder || "-"}</span></p>
                    <p className="text-sm">Supply: <span className="font-medium">{selectedOrder.modeOfSupply || "-"}</span></p>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs">
                        {selectedOrder.hasSchoolOrderCopy ? <Check className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3 border" />} School Copy
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {selectedOrder.hasDistributorOrderCopy ? <Check className="w-3 h-3 text-green-600" /> : <div className="w-3 h-3 border" />} Distributor Copy
                      </div>
                    </div>
                  </div>
                </div>

                {/* School Information */}
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h4 className="font-bold text-slate-800 uppercase border-b pb-2">School Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p>Trust Name: <span className="font-medium">{selectedOrder.trustName || "-"}</span></p>
                    <p>Board: <span className="font-medium">{selectedOrder.board || "-"}</span></p>
                    <p>School Type: <span className="font-medium">{selectedOrder.schoolType || "-"}</span></p>
                    <p>Email: <span className="font-medium">{selectedOrder.emailId || "-"}</span></p>
                    <p className="md:col-span-2">Address: <span className="font-medium">{selectedOrder.address || "-"}</span></p>
                    <p>Pincode: <span className="font-medium">{selectedOrder.pincode || "-"}</span></p>
                    <p>State: <span className="font-medium">{selectedOrder.state || "-"}</span></p>
                    <p>School Phone: <span className="font-medium">{selectedOrder.schoolPhone || "-"}</span></p>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-slate-900 text-white p-6 rounded-lg space-y-4 border-2">
                  <h4 className="font-bold uppercase border-b border-white/20 pb-2 text-center tracking-widest">Estimated Invoice Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross Total:</span>
                      <span className="font-mono">INR {selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Discount:</span>
                      <span className="font-mono text-blue-400">{selectedOrder.discount}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Discount:</span>
                      <span className="font-mono text-red-400">INR {selectedOrder.totalDiscount}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                      <span className="text-lg font-bold">NET AMOUNT:</span>
                      <span className="text-2xl font-black text-green-400 font-mono">INR {selectedOrder.netAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Full item-wise breakdown available in the generated PDF</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}