import { useQuery } from "@tanstack/react-query";
import { Dispatch } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
import { Loader2, Eye, Download } from "lucide-react";
import { format } from "date-fns";

export default function DispatchInfo() {
  const [, setLocation] = useLocation();
  const { data: dispatches, isLoading } = useQuery<Dispatch[]>({
    queryKey: ["/api/dispatches"],
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
      <h1 className="text-3xl font-bold">Dispatch Info</h1>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>LR No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Packing List</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches?.map((dispatch) => (
                <TableRow key={dispatch.id}>
                  <TableCell>{format(new Date(dispatch.dispatchDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{dispatch.lrNo}</TableCell>
                  <TableCell>{dispatch.bookType}</TableCell>
                  <TableCell>{dispatch.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
