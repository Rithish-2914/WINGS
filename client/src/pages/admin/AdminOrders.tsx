import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const downloadPDF = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MASTER BRAINS - ORDER INVOICE", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 15, 25);
    doc.text(`Date: ${order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}`, 15, 30);
    
    doc.setFontSize(12);
    doc.text("SCHOOL DETAILS", 15, 40);
    doc.setFontSize(10);
    doc.text(`School Name: ${order.schoolName}`, 15, 45);
    doc.text(`Address: ${order.address || "-"}`, 15, 50);
    doc.text(`Phone: ${order.schoolPhone || "-"}`, 15, 55);

    const items = order.items as Record<string, any>;
    const tableData = Object.entries(items)
      .filter(([key]) => !key.endsWith("-discount"))
      .map(([key, value]) => {
        const [category, product] = key.split("-");
        return [category, product, value.price, value.qty, (value.price * parseInt(value.qty || "0")).toFixed(2)];
      });

    (doc as any).autoTable({
      startY: 65,
      head: [["Category", "Product", "Price", "Qty", "Total"]],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Amount: ${order.totalAmount}`, 140, finalY);
    doc.text(`Total Discount: ${order.totalDiscount}`, 140, finalY + 5);
    doc.text(`Net Amount: ${order.netAmount}`, 140, finalY + 10);

    doc.save(`order-${order.schoolName}-${order.id}.pdf`);
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
                <TableHead>Executive ID</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}</TableCell>
                  <TableCell className="font-medium">{order.schoolName}</TableCell>
                  <TableCell>{order.userId}</TableCell>
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
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.schoolName}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold border-b mb-2">School Info</h4>
                  <p>Trust: {selectedOrder.trustName || "-"}</p>
                  <p>Board: {selectedOrder.board || "-"}</p>
                  <p>Type: {selectedOrder.schoolType || "-"}</p>
                  <p>Address: {selectedOrder.address || "-"}</p>
                </div>
                <div>
                  <h4 className="font-bold border-b mb-2">Contact Info</h4>
                  <p>Principal: {selectedOrder.principalName || "-"}</p>
                  <p>Mobile: {selectedOrder.principalMobile || "-"}</p>
                  <p>Email: {selectedOrder.emailId || "-"}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold border-b mb-2">Order Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(selectedOrder.items as Record<string, any>)
                      .filter(([key]) => !key.endsWith("-discount"))
                      .map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>{key.split("-")[1]}</TableCell>
                          <TableCell>{value.price}</TableCell>
                          <TableCell>{value.qty}</TableCell>
                          <TableCell className="text-right">{(value.price * parseInt(value.qty || "0")).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-4 font-bold border-t pt-4">
                <p>Total: {selectedOrder.totalAmount}</p>
                <p>Discount: {selectedOrder.totalDiscount}</p>
                <p className="text-primary">Net: {selectedOrder.netAmount}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
