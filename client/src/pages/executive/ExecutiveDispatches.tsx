import { useQuery, useMutation } from "@tanstack/react-query";
import { Dispatch, PackingList } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
import { Loader2, Eye, CheckCircle2, Package, Truck, MapPin } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ExecutiveDispatches() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: dispatches, isLoading } = useQuery<(Dispatch & { executiveName?: string })[]>({
    queryKey: ["/api/dispatches"],
  });

  const deliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/dispatches/${id}/status`, { status: "delivered" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Success", description: "Marked as delivered" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/")}>Back</Button>
        <h1 className="text-3xl font-bold">My Dispatches</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {dispatches?.map((dispatch) => (
          <Card key={dispatch.id} className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    LR No: {dispatch.lrNo}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(dispatch.dispatchDate), "PPP")}
                  </p>
                </div>
                <Badge variant={dispatch.status === 'delivered' ? 'default' : 'secondary'}>
                  {dispatch.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Parcel Info</p>
                    <p className="text-sm font-medium">{dispatch.modeOfParcel}</p>
                    <p className="text-xs text-muted-foreground">{dispatch.noOfBox} Boxes | {dispatch.bookType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Courier Mode</p>
                    <p className="text-sm font-medium">{dispatch.courierMode || "Not Specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{dispatch.dispatchLocation || "Not Specified"}</p>
                  </div>
                </div>
              </div>

              {dispatch.remarks && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{dispatch.remarks}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <PackingListDialog dispatchId={dispatch.id} />
                
                {dispatch.status !== 'delivered' && (
                  <Button 
                    onClick={() => deliveryMutation.mutate(dispatch.id)}
                    disabled={deliveryMutation.isPending}
                  >
                    {deliveryMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Mark as Delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {dispatches?.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No dispatch records found for you.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function PackingListDialog({ dispatchId }: { dispatchId: number }) {
  const { data: packingList, isLoading } = useQuery<PackingList>({
    queryKey: [`/api/packing-lists/${dispatchId}`],
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          View Packing List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Packing List Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : packingList ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(packingList.items as any[])?.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right font-bold">{item.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {packingList.remarks && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Packing Remarks</p>
                <p className="text-sm">{packingList.remarks}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No packing list found for this dispatch.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
