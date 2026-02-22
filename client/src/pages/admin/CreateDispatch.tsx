import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertDispatch, InsertPackingList } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PACKING_ITEM_CATEGORIES = [
  "Kinder Box 1.0",
  "Kinder Box Plus 2.0",
  "Kinder Play",
  "Little Steps",
  "Special Edition",
  "Play Group",
  "Wings – Semester",
  "General –Books"
];

export default function CreateDispatch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<InsertDispatch>>({
    executiveId: undefined,
    dispatchDate: new Date(),
    bookType: "Sales",
    modeOfParcel: "SINDHU PARCEL SERVICE",
    lrNo: "",
    noOfBox: 1,
    ref: "",
    remarks: "",
    status: "Not Delivered"
  });

  const [packingItems, setPackingItems] = useState<{ category: string, qty: string }[]>([]);
  const [packingRemarks, setPackingRemarks] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: dispatches, isLoading: isLoadingDispatches } = useQuery<any[]>({
    queryKey: ["/api/dispatches"],
  });

  const { data: packingLists } = useQuery<any[]>({
    queryKey: ["/api/packing-lists"],
    enabled: !!selectedDispatch,
  });

  const dispatchMutation = useMutation({
    mutationFn: async (data: { dispatch: InsertDispatch, packingList: InsertPackingList }) => {
      const dispatchRes = await apiRequest("POST", "/api/dispatches", data.dispatch);
      const dispatch = await dispatchRes.json();
      
      await apiRequest("POST", "/api/packing-lists", {
        dispatchId: dispatch.id,
        items: data.packingList.items,
        remarks: data.packingList.remarks
      });
      
      return dispatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Success", description: "Dispatch and Packing List created successfully" });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const executives = users?.filter(u => u.role === 'executive') || [];

  const handleCreate = () => {
    if (!formData.executiveId || !formData.lrNo) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select an executive and enter LR No." });
      return;
    }

    const dispatchData: any = {
      executiveId: Number(formData.executiveId),
      dispatchDate: formData.dispatchDate || new Date(),
      dispatchLocation: formData.dispatchLocation || null,
      courierMode: formData.courierMode || null,
      bookType: formData.bookType || "Sales",
      modeOfParcel: formData.modeOfParcel || "",
      lrNo: formData.lrNo,
      noOfBox: Number(formData.noOfBox || 1),
      ref: formData.ref || null,
      remarks: formData.remarks || null,
      status: formData.status || "Not Delivered"
    };

    const packingListData: any = {
      dispatchId: 0, // Will be set after dispatch creation
      items: packingItems,
      remarks: packingRemarks || ""
    };

    dispatchMutation.mutate({ dispatch: dispatchData, packingList: packingListData });
  };

  const addPackingItem = () => {
    setPackingItems([...packingItems, { category: PACKING_ITEM_CATEGORIES[0], qty: "1" }]);
  };

  const removePackingItem = (index: number) => {
    setPackingItems(packingItems.filter((_, i) => i !== index));
  };

  const updatePackingItem = (index: number, field: 'category' | 'qty', value: string) => {
    const newItems = [...packingItems];
    newItems[index][field] = value;
    setPackingItems(newItems);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold">Create Dispatch</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Executive</label>
                <Select onValueChange={(val) => setFormData({ ...formData, executiveId: Number(val) })}>
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
                <Input 
                  type="date" 
                  onChange={(e) => setFormData({ ...formData, dispatchDate: new Date(e.target.value) })}
                  defaultValue={new Date().toISOString().split('T')[0]} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type of Books</label>
                <Select defaultValue="Sales" onValueChange={(val) => setFormData({ ...formData, bookType: val })}>
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
                <label className="text-sm font-medium">Dispatch Location</label>
                <Input 
                  placeholder="e.g. Warehouse A"
                  value={formData.dispatchLocation ?? ""} 
                  onChange={(e) => setFormData({ ...formData, dispatchLocation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mode of Courier</label>
                <Input 
                  placeholder="e.g. DTDC / Professional"
                  value={formData.courierMode ?? ""} 
                  onChange={(e) => setFormData({ ...formData, courierMode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mode of Parcel</label>
                <Input 
                  placeholder="e.g. SINDHU PARCEL SERVICE"
                  value={formData.modeOfParcel} 
                  onChange={(e) => setFormData({ ...formData, modeOfParcel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">LR No.</label>
                <Input 
                  placeholder="Alpha-numerical LR No"
                  value={formData.lrNo}
                  onChange={(e) => setFormData({ ...formData, lrNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">No. Of Box</label>
                <Input 
                  type="number" 
                  value={formData.noOfBox}
                  onChange={(e) => setFormData({ ...formData, noOfBox: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Ref</label>
                <Input 
                  placeholder="xyz school sample/order" 
                  value={formData.ref || ""}
                  onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Remarks (Max 200 words)</label>
                <textarea 
                  className="w-full min-h-[80px] p-3 rounded-md border bg-background text-sm"
                  placeholder="Enter remarks..."
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="Not Delivered" onValueChange={(val) => setFormData({ ...formData, status: val })}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create Packing List</CardTitle>
            <Button variant="outline" size="sm" onClick={addPackingItem}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packingItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="p-2">
                      <Select value={item.category} onValueChange={(val) => updatePackingItem(index, 'category', val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKING_ITEM_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-2">
                      <Input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updatePackingItem(index, 'qty', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => removePackingItem(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {packingItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      No items added to packing list
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">Packing Remarks (Max 250 words)</label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm"
                placeholder="Enter packing remarks..."
                value={packingRemarks || ""}
                onChange={(e) => setPackingRemarks(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => setLocation("/admin")}>Cancel</Button>
        <Button 
          onClick={handleCreate} 
          disabled={dispatchMutation.isPending}
          className="min-w-[200px]"
        >
          {dispatchMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            "Create Dispatch & Packing List"
          )}
        </Button>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Dispatches</CardTitle>
          <div className="flex gap-4">
            <Input 
              placeholder="Search by LR No or Executive..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-44"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Executive</TableHead>
                  <TableHead>LR No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDispatches ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !dispatches || dispatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No dispatches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  dispatches
                    .filter((d: any) => {
                      const searchLower = searchTerm.toLowerCase();
                      const matchesSearch = 
                        (d.lrNo || "").toLowerCase().includes(searchLower) ||
                        (d.executiveName || "").toLowerCase().includes(searchLower);
                      const matchesDate = !dateFilter || new Date(d.dispatchDate).toISOString().split('T')[0] === dateFilter;
                      return matchesSearch && matchesDate;
                    })
                    .map((dispatch: any) => (
                    <TableRow key={dispatch.id}>
                      <TableCell>{new Date(dispatch.dispatchDate).toLocaleDateString()}</TableCell>
                      <TableCell>{dispatch.executiveName || "N/A"}</TableCell>
                      <TableCell>{dispatch.lrNo}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          dispatch.status === 'Received' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dispatch.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDispatch(dispatch)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedDispatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
              <CardTitle>Dispatch & Packaging Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDispatch(null)}>Close</Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Executive</h3>
                  <p className="text-base">{selectedDispatch.executiveName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Dispatch Date</h3>
                  <p className="text-base">{new Date(selectedDispatch.dispatchDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Book Type</h3>
                  <p className="text-base">{selectedDispatch.bookType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Dispatch Location</h3>
                  <p className="text-base">{selectedDispatch.dispatchLocation || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Courier Mode</h3>
                  <p className="text-base">{selectedDispatch.courierMode || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Mode of Parcel</h3>
                  <p className="text-base">{selectedDispatch.modeOfParcel}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">LR No.</h3>
                  <p className="text-base">{selectedDispatch.lrNo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">No. Of Boxes</h3>
                  <p className="text-base">{selectedDispatch.noOfBox}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                  <p className="text-base">{selectedDispatch.status}</p>
                </div>
              </div>

              {selectedDispatch.ref && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Reference</h3>
                  <p className="text-base bg-muted p-2 rounded">{selectedDispatch.ref}</p>
                </div>
              )}

              {selectedDispatch.remarks && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Dispatch Remarks</h3>
                  <p className="text-base bg-muted p-2 rounded whitespace-pre-wrap">{selectedDispatch.remarks}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">Packing List</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-32">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packingLists?.filter((pl: any) => pl.dispatchId === selectedDispatch.id).map((pl: any) => (
                      pl.items.map((item: any, idx: number) => (
                        <TableRow key={`${pl.id}-${idx}`}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                        </TableRow>
                      ))
                    ))}
                    {(!packingLists || packingLists.filter((pl: any) => pl.dispatchId === selectedDispatch.id).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                          No packing items found for this dispatch.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {packingLists?.filter((pl: any) => pl.dispatchId === selectedDispatch.id)[0]?.remarks && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Packing Remarks</h3>
                    <p className="text-base bg-muted p-2 rounded whitespace-pre-wrap">
                      {packingLists.filter((pl: any) => pl.dispatchId === selectedDispatch.id)[0].remarks}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
