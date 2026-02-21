import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, type InsertOrder, type Order } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoute } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGES = [
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

export default function PublicOrderForm() {
  const [, params] = useRoute("/orders/public/:token");
  const token = params?.token;
  const [page, setPage] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: order, isLoading: orderLoading, error } = useQuery<Order>({
    queryKey: [`/api/orders/public/${token}`],
    enabled: !!token,
  });

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      schoolName: order?.schoolName || "",
      items: (order?.items as Record<string, any>) || {},
      totalAmount: order?.totalAmount || "0",
      totalDiscount: order?.totalDiscount || "0",
      netAmount: order?.netAmount || "0",
      schoolCode: order?.schoolCode || "",
      schoolNameOffice: order?.schoolNameOffice || "",
      placeOffice: order?.placeOffice || "",
      trustName: order?.trustName || "",
      board: order?.board || "",
      schoolType: order?.schoolType || "",
      address: order?.address || "",
      pincode: order?.pincode || "",
      state: order?.state || "",
      emailId: order?.emailId || "",
      schoolPhone: order?.schoolPhone || "",
      principalName: order?.principalName || "",
      principalMobile: order?.principalMobile || "",
      deliveryDate: order?.deliveryDate ? new Date(order?.deliveryDate) : undefined,
    }
  });

  const items = useWatch({ control: form.control, name: "items" }) as Record<string, any> || {};

  useEffect(() => {
    let total = 0;
    Object.keys(BOOK_DATA).forEach(category => {
      const books = getBookData(category);
      books.forEach((book: any) => {
        const itemKey = `${category}-${book.product}`;
        const qty = parseInt(items[itemKey]?.qty || "0");
        if (qty > 0) {
          total += qty * book.price;
        }
      });
    });

    const overallDiscountPerc = parseFloat(Object.values(items).find((v: any) => v && v.value && !v.qty)?.value || "0");
    const discountAmt = (total * overallDiscountPerc / 100);
    const net = total - discountAmt;
    
    form.setValue("totalAmount", total.toFixed(2));
    form.setValue("totalDiscount", discountAmt.toFixed(2));
    form.setValue("netAmount", net.toFixed(2));
  }, [items, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const res = await apiRequest("POST", `/api/orders/public/${token}`, data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Order submitted successfully" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });

  if (orderLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error || !order) return <div className="flex items-center justify-center min-h-screen text-destructive font-bold">Invalid or expired order link.</div>;
  if (order.isPublicFilled || submitted) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <CheckCircle2 className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-bold">Thank You!</h1>
      <p className="text-muted-foreground">The order form has been submitted successfully.</p>
    </div>
  );

  const getBookData = (category: string) => (BOOK_DATA as any)[category] || [];

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
            <TableCell colSpan={3} className="text-right font-medium text-muted-foreground">Discount (Executive only):</TableCell>
            <TableCell>
              <Input 
                type="text" 
                className="h-8 bg-slate-50"
                disabled
                placeholder="-"
                value={items[`${category}-discount`]?.value ? `${items[`${category}-discount`].value}%` : ""}
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
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-2xl font-black text-slate-800">MASTER BRAINS</CardTitle>
          <p className="text-xs font-bold text-slate-500 uppercase">SCHOOL ORDER FORM - {PAGES[page]}</p>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              {page === 0 && (
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
                  </div>
                </div>
              )}

              {page === 1 && (
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h3 className="font-bold uppercase text-lg text-slate-800 border-b pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="principalName" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Principal Name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="principalMobile" render={({ field }) => (
                      <FormItem><FormLabel className="font-bold uppercase text-xs">Mobile</FormLabel><FormControl><Input {...field} value={field.value ?? ""} className="border-2" /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              )}

              {page === 2 && (
                <div className="space-y-4 border-2 p-4 rounded-lg">
                  <h3 className="font-bold uppercase text-lg text-slate-800 border-b pb-2">Dispatch Details</h3>
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold uppercase text-xs">Preferred Delivery Date:</FormLabel>
                      <FormControl>
                        <Input type="date" className="border-2" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {page === 3 && renderBookTable("Kinder Box 1.0", "Kinder Box 1.0 (Revised)")}
              {page === 4 && renderBookTable("Kinder Box Plus 2.0", "Kinder Box Plus 2.0")}
              {page === 5 && renderBookTable("Special Edition", "Special Edition")}
              {page === 6 && renderBookTable("Kinder Play", "Kinder Play")}
              {page === 7 && renderBookTable("Little Steps", "Little Steps")}
              {page === 8 && renderBookTable("Young Minds", "Young Minds")}
              {page === 9 && renderBookTable("General Books", "General Books")}

              {page === 10 && (
                <div className="bg-slate-900 text-white p-6 rounded-lg space-y-4 border-2">
                  <h4 className="font-bold uppercase border-b border-white/20 pb-2 text-center tracking-widest">Order Summary</h4>
                  <p className="text-center text-slate-400">Please review your order and click submit to confirm.</p>
                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-black" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    SUBMIT FINAL ORDER
                  </Button>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0} className="border-2 font-bold uppercase">Back</Button>
                {page < PAGES.length - 1 && (
                  <Button type="button" onClick={() => setPage(p => p + 1)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase">Next</Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
