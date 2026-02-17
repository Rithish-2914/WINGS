import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type InsertOrder } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Loader2, Download, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGES = [
  "Office Use & Mode",
  "School Information",
  "Contact Details",
  "Dispatch Details",
  "Kinder Box 1.0 (Revised)",
  "Kinder Box Plus 2.0",
  "Special Edition",
  "Kinder Play",
  "Little Steps",
  "Young Minds",
  "General Books",
  "Estimated Invoice"
];

const BOOK_DATA = {
  "Kinder Box 1.0": [
    { class: "Nursery", product: "Nursery Pack of 5 books", price: 950 },
    { class: "LKG", product: "LKG - Pack of 9 Books", price: 2175 },
    { class: "UKG", product: "UKG - Pack of 9 Books", price: 2175 },
  ],
  "Kinder Box Plus 2.0": [
    { class: "Nursery", product: "Nursery Pack of 7 books", price: 1600 },
    { class: "LKG", product: "LKG - Pack of 14 Books", price: 2875 },
    { class: "UKG", product: "UKG - Pack of 14 Books", price: 2975 },
  ],
  "Special Edition": [
    { class: "Nursery", product: "Nursery (Pack of 3 books)", price: 690 },
    { class: "LKG", product: "LKG - Pack of 6 Books", price: 1425 },
    { class: "UKG", product: "UKG - Pack of 6 Books", price: 1425 },
  ],
  "Kinder Play": [
    { class: "LKG", product: "LKG - Pack of 10 Books", price: 2025 },
    { class: "UKG", product: "UKG - Pack of 11 Books", price: 2125 },
  ],
  "Little Steps": [
    { class: "Nursery", product: "Nursery Pack of 6 books", price: 1075 },
    { class: "LKG", product: "LKG - Pack of 7 Books", price: 1825 },
    { class: "UKG", product: "UKG - Pack of 7 Books", price: 1925 },
  ],
  "Little Steps Combo": [
    { class: "LKG", product: "LKG - Pack of 9 Books", price: 2075 },
    { class: "UKG", product: "UKG - Pack of 11 Books", price: 2425 },
  ],
  "Young Minds": [
    { class: "Nursery", product: "Nursery (Pack of 2 books)", price: 575 },
    { class: "LKG", product: "LKG - Pack of 4 Books", price: 1475 },
    { class: "UKG", product: "UKG - Pack of 4 Books", price: 1475 },
  ],
  "General Books": [
    { class: "TELUGU", product: "Telugu Aksharamala", price: 150 },
    { class: "HINDI", product: "Hindi Aksharamala", price: 150 },
    { class: "TELUGU", product: "Telugu Varnamala", price: 150 },
    { class: "HINDI", product: "Hindi Varnamala", price: 150 },
    { class: "NUR", product: "Let's Do & Let's Colour Book - A", price: 110 },
    { class: "LKG", product: "Let's Do & Let's Colour Book - B", price: 110 },
    { class: "UKG", product: "Let's Do & Let's Colour Book - C", price: 110 },
    { class: "NUR", product: "Play with Strokes - A", price: 110 },
    { class: "LKG", product: "Play with Strokes - B", price: 110 },
    { class: "LKG", product: "Cut & Paste Book - A", price: 110 },
    { class: "UKG", product: "Cut & Paste Book - B", price: 110 },
    { class: "NUR", product: "Pre Printed Skill Books - Pack of 2", price: 190 },
    { class: "LKG", product: "Pre Printed Skill Books - Pack of 2", price: 320 },
    { class: "UKG", product: "Pre Printed Skill Books - Pack of 2", price: 320 },
    { class: "TELUGU", product: "Pre Printed Skill Book", price: 160 },
    { class: "HINDI", product: "Pre Printed Skill Book", price: 160 },
  ]
};

export default function OrderForm() {
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      schoolName: "",
      items: {},
      hasSchoolOrderCopy: false,
      hasDistributorOrderCopy: false,
      totalAmount: "0",
      totalDiscount: "0",
      netAmount: "0",
    }
  });

  const items = useWatch({ control: form.control, name: "items" }) || {};

  const getBookData = (category: string) => {
    return (BOOK_DATA as any)[category] || [];
  };

  useEffect(() => {
    let total = 0;
    Object.keys(BOOK_DATA).forEach(category => {
      const books = getBookData(category);
      books.forEach((book: any) => {
        const qty = parseInt(items[`${category}-${book.product}`]?.qty || "0");
        if (qty > 0) {
          total += qty * book.price;
        }
      });
    });

    const overallDiscount = parseFloat(form.getValues("totalDiscount") || "0");
    const net = total - overallDiscount;
    
    form.setValue("totalAmount", total.toString());
    form.setValue("netAmount", net.toString());
  }, [items, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order submitted successfully" });
      setLocation("/orders");
    }
  });

  const downloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfWidth - (2 * margin);

    const toastId = toast({
      title: "Generating PDF",
      description: "Capturing all 12 pages, please wait...",
    });

    try {
      const originalPage = page;
      
      // We'll capture 12 pages as defined in PAGES array
      for (let i = 0; i < PAGES.length; i++) {
        setPage(i);
        // Wait for state update and re-render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const element = document.getElementById("order-form-content");
        if (!element) continue;

        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // Add header info on each page
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`MASTER BRAINS - Page ${i + 1}: ${PAGES[i]}`, margin, 8);
        
        pdf.addImage(imgData, "PNG", margin, margin + 5, contentWidth, imgHeight);
      }
      
      setPage(originalPage);
      pdf.save(`order-${form.getValues("schoolName") || "draft"}-${format(new Date(), "yyyyMMdd")}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF generated with all 7 sections.",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({
        title: "Error",
        description: "Failed to generate full PDF. Try again.",
        variant: "destructive"
      });
    }
  };

  const renderBookTable = (category: string, title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold border-b pb-2">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">CLASS</TableHead>
            <TableHead>PRODUCT NAME</TableHead>
            <TableHead className="w-24">PRICE</TableHead>
            <TableHead className="w-24">QTY</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getBookData(category).map((book: any, idx: number) => (
            <TableRow key={idx}>
              <TableCell className="font-medium">{book.class}</TableCell>
              <TableCell>{book.product}</TableCell>
              <TableCell>{book.price}</TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  className="h-8"
                  value={items[`${category}-${book.product}`]?.qty || ""}
                  onChange={(e) => {
                    const newItems = { ...items };
                    newItems[`${category}-${book.product}`] = { 
                      qty: e.target.value,
                      price: book.price
                    };
                    form.setValue("items", newItems);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">Discount :</TableCell>
            <TableCell>
              <Input 
                type="number" 
                className="h-8"
                placeholder="%"
                value={items[`${category}-discount`]?.value || ""}
                onChange={(e) => {
                  const newItems = { ...items };
                  newItems[`${category}-discount`] = { value: e.target.value };
                  form.setValue("items", newItems);
                }}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between sticky top-0 z-10">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800">MASTER BRAINS</CardTitle>
            <p className="text-xs font-bold text-slate-500">PRE PRIMARY BOOKS - {PAGES[page]}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadPDF} className="font-bold border-2">
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </CardHeader>
        
        <CardContent id="order-form-content" className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              
              {page === 0 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-2 rounded-lg bg-slate-50">
                    <h3 className="col-span-full font-bold text-slate-700">For Office Use Only:</h3>
                    <FormField control={form.control} name="schoolCode" render={({ field }) => (
                      <FormItem><FormLabel>School Code:</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="schoolNameOffice" render={({ field }) => (
                      <FormItem><FormLabel>School Name:</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="placeOffice" render={({ field }) => (
                      <FormItem><FormLabel>Place:</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 border-2 p-4 rounded-lg">
                      <h3 className="font-bold uppercase text-sm text-slate-600">Mode of Order</h3>
                      <FormField control={form.control} name="modeOfOrder" render={({ field }) => (
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={field.value === "SCHOOL"} onCheckedChange={() => field.onChange("SCHOOL")} />
                            <label className="text-sm font-bold">SCHOOL</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={field.value === "DISTRIBUTOR"} onCheckedChange={() => field.onChange("DISTRIBUTOR")} />
                            <label className="text-sm font-bold">DISTRIBUTOR</label>
                          </div>
                        </div>
                      )} />
                    </div>
                    <div className="space-y-4 border-2 p-4 rounded-lg">
                      <h3 className="font-bold uppercase text-sm text-slate-600">Mode of Supply</h3>
                      <FormField control={form.control} name="modeOfSupply" render={({ field }) => (
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={field.value === "SCHOOL"} onCheckedChange={() => field.onChange("SCHOOL")} />
                            <label className="text-sm font-bold">SCHOOL</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={field.value === "DISTRIBUTOR"} onCheckedChange={() => field.onChange("DISTRIBUTOR")} />
                            <label className="text-sm font-bold">DISTRIBUTOR</label>
                          </div>
                        </div>
                      )} />
                    </div>
                  </div>

                  <div className="space-y-4 border-2 p-4 rounded-lg">
                    <h3 className="font-bold uppercase text-sm text-slate-600">List of Attachments / Enclosures</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="hasSchoolOrderCopy" render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="font-bold">School Order Copy</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="hasDistributorOrderCopy" render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="font-bold">Distributor Order Copy</FormLabel>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              )}

              {page === 1 && (
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h3 className="font-bold uppercase text-lg text-slate-800 border-b pb-2">School Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField control={form.control} name="schoolName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">School Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="trustName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Trust Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="board" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">Board</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="schoolType" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">School Type</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Address</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="pincode" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">Pincode</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">State</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="emailId" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">Email ID</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="schoolPhone" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold uppercase text-xs">School PH Number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              )}

              {page === 2 && (
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h3 className="font-bold uppercase text-lg text-slate-800 border-b pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="correspondentName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Correspondent</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="correspondentMobile" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="principalName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Principal</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="principalMobile" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="accountsName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Accounts</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="accountsMobile" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="programmeInChargeName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Programme In Charge</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="programmeInChargeMobile" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              )}

              {page === 3 && (
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h3 className="font-bold uppercase text-lg text-slate-800 border-b pb-2">Dispatch Details</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-bold uppercase text-xs">Delivery Date:</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="border-2"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} 
                            onChange={(e) => field.onChange(e.target.value)} 
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="preferredTransport1" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Preferred Mode of Transport-1:</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="preferredTransport2" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Preferred Mode of Transport-2:</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              )}

              {page === 4 && renderBookTable("Kinder Box 1.0", "KINDER BOX - 1.0 (REVISED EDITION)")}
              {page === 5 && renderBookTable("Kinder Box Plus 2.0", "KINDER BOX PLUS - 2.0")}
              {page === 6 && renderBookTable("Special Edition", "SPECIAL EDITION")}
              {page === 7 && renderBookTable("Kinder Play", "KINDER PLAY")}
              {page === 8 && (
                <div className="space-y-8">
                  {renderBookTable("Little Steps", "LITTLE STEPS")}
                  {renderBookTable("Little Steps Combo", "LITTLE STEPS (COMBO PACK)")}
                </div>
              )}
              {page === 9 && renderBookTable("Young Minds", "YOUNG MINDS")}
              {page === 10 && renderBookTable("General Books", "GENERAL BOOKS")}

              {page === 11 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black border-b-4 pb-2 text-slate-800">ESTIMATED INVOICE</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border-2">
                    <div className="space-y-4">
                      <FormField control={form.control} name="totalAmount" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-600">SUB TOTAL AMOUNT</FormLabel><FormControl><Input {...field} value={field.value ?? "0"} readOnly className="font-bold bg-white text-lg h-12 border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="totalDiscount" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-600">OVERALL DISCOUNT</FormLabel><FormControl><Input {...field} value={field.value ?? "0"} className="font-bold bg-white text-lg h-12 border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="netAmount" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-900 text-lg">NET AMOUNT</FormLabel><FormControl><Input {...field} value={field.value ?? "0"} readOnly className="font-black bg-blue-50 text-blue-900 text-2xl h-16 border-4 border-blue-200" /></FormControl></FormItem>
                      )} />
                    </div>
                    <div className="space-y-4">
                      <FormField control={form.control} name="advancePayment" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-600">ADVANCE PAYMENT</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="font-bold bg-white text-lg h-12 border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="firstInstalment" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-600">1ST INSTALMENT</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="font-bold bg-white text-lg h-12 border-2" /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="secondInstalment" render={({ field }) => (
                        <FormItem><FormLabel className="font-black text-slate-600">2ND INSTALMENT</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="font-bold bg-white text-lg h-12 border-2" /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-xs font-bold text-yellow-800 space-y-2">
                    <p className="uppercase underline">Terms & Conditions:</p>
                    <p>No Cash transactions or online transfers to local executives. All Payments to "MASTER BRAINS" authorised account only. DO NOT pay in cash.</p>
                  </div>
                </div>
              )}

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between container mx-auto max-w-4xl z-20">
                <Button type="button" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="font-bold border-2">
                  <ChevronLeft className="w-4 h-4 mr-2" /> PREVIOUS
                </Button>
                <div className="flex gap-2">
                  <div className="hidden md:flex items-center px-4 bg-slate-100 rounded-full text-xs font-black text-slate-500 uppercase">
                    PAGE {page + 1} OF {PAGES.length}
                  </div>
                  {page < PAGES.length - 1 ? (
                    <Button type="button" onClick={() => {
                      // Validate only if necessary, here we just go next
                      setPage(p => p + 1);
                      window.scrollTo(0, 0);
                    }} className="font-bold shadow-md bg-slate-800 hover:bg-slate-700">
                      NEXT <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={mutation.isPending} className="font-bold shadow-md bg-green-600 hover:bg-green-700 px-8">
                      {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "FINISH & SUBMIT"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
