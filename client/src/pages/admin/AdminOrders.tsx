import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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

          autoTable(doc, {
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
      alert("Failed to generate PDF. Please check the console for details.");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading orders...</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> All Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>Executive</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell className="font-medium">{order.schoolName}</TableCell>
                  <TableCell>{order.userName || `ID: ${order.userId}`}</TableCell>
                  <TableCell>{order.netAmount || order.totalAmount || "0.00"}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadPDF(order)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-black text-slate-800 border-b pb-4 flex justify-between items-center">
              <span>ORDER DETAILS - {selectedOrder?.schoolName}</span>
              {selectedOrder && (
                <Button variant="outline" size="sm" onClick={() => downloadPDF(selectedOrder)}>
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-6 space-y-8">
              {/* Page 1: Office Use */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-2 p-4 rounded-lg bg-slate-50">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase text-sm border-b pb-1">Office Use Only</h4>
                  <p className="text-sm">School Code: <span className="font-medium">{selectedOrder.schoolCode || "-"}</span></p>
                  <p className="text-sm">School Name: <span className="font-medium">{selectedOrder.schoolNameOffice || "-"}</span></p>
                  <p className="text-sm">Place: <span className="font-medium">{selectedOrder.placeOffice || "-"}</span></p>
                  <p className="text-sm">Executive: <span className="font-medium">{selectedOrder.userName || `ID: ${selectedOrder.userId}`}</span></p>
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

              {/* Page 2: School Info */}
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

              {/* Page 3: Contact Details */}
              <div className="space-y-4 border-2 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 uppercase border-b pb-2">Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Correspondent</p>
                    <p className="font-medium">{selectedOrder.correspondentName || "-"}</p>
                    <p className="text-xs">{selectedOrder.correspondentMobile || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Principal</p>
                    <p className="font-medium">{selectedOrder.principalName || "-"}</p>
                    <p className="text-xs">{selectedOrder.principalMobile || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Accounts</p>
                    <p className="font-medium">{selectedOrder.accountsName || "-"}</p>
                    <p className="text-xs">{selectedOrder.accountsMobile || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Programme In Charge</p>
                    <p className="font-medium">{selectedOrder.programmeInChargeName || "-"}</p>
                    <p className="text-xs">{selectedOrder.programmeInChargeMobile || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Page 4: Dispatch */}
              <div className="space-y-4 border-2 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 uppercase border-b pb-2">Dispatch Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p>Delivery Date: <span className="font-medium">{selectedOrder.deliveryDate ? format(new Date(selectedOrder.deliveryDate), "dd MMM yyyy") : "-"}</span></p>
                  <p>Transport 1: <span className="font-medium">{selectedOrder.preferredTransport1 || "-"}</span></p>
                  <p>Transport 2: <span className="font-medium">{selectedOrder.preferredTransport2 || "-"}</span></p>
                </div>
              </div>

              {/* Pages 5-11: Items */}
              <div className="space-y-6">
                <h4 className="font-bold text-slate-800 uppercase border-b pb-2">Book Order Details</h4>
                {CATEGORIES.map(category => {
                  const items = selectedOrder.items as Record<string, any>;
                  const categoryItems = Object.entries(items).filter(([key]) => key.startsWith(`${category}-`) && !key.endsWith("-discount"));
                  
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2">
                      <h5 className="text-sm font-bold text-slate-600">{category}</h5>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="h-8">Product</TableHead>
                            <TableHead className="h-8 w-24">Price</TableHead>
                            <TableHead className="h-8 w-24">Qty</TableHead>
                            <TableHead className="h-8 w-24 text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryItems.map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="py-2">{key.substring(category.length + 1)}</TableCell>
                              <TableCell className="py-2">{value.price}</TableCell>
                              <TableCell className="py-2">{value.qty}</TableCell>
                              <TableCell className="py-2 text-right">{(value.price * parseInt(value.qty || "0")).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>

              {/* Page 12: Estimated Invoice Summary */}
              <div className="bg-slate-900 text-white p-6 rounded-lg space-y-4 border-2">
                <h4 className="font-bold uppercase border-b border-white/20 pb-2 text-center tracking-widest">Estimated Invoice Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Total:</span>
                    <span className="font-mono">INR {selectedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Total Discount:</span>
                    <span className="font-mono">- INR {selectedOrder.totalDiscount}</span>
                  </div>
                  <div className="flex justify-between text-2xl border-t border-white/20 pt-4 font-black">
                    <span className="text-primary">NET AMOUNT:</span>
                    <span className="text-primary">INR {selectedOrder.netAmount}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[10px] mt-4 pt-4 border-t border-white/10 uppercase tracking-tighter">
                  <div className="text-center border-r border-white/10">
                    <p className="text-slate-500">Advance</p>
                    <p className="font-bold text-sm">INR {selectedOrder.advancePayment || "0.00"}</p>
                  </div>
                  <div className="text-center border-r border-white/10">
                    <p className="text-slate-500">1st Inst.</p>
                    <p className="font-bold text-sm">INR {selectedOrder.firstInstalment || "0.00"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">2nd Inst.</p>
                    <p className="font-bold text-sm">INR {selectedOrder.secondInstalment || "0.00"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
