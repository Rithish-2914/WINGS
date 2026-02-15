import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Calendar, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminLeaves() {
  const { data: leaves, isLoading: isLoadingLeaves } = useQuery<any[]>({
    queryKey: ["/api/leaves"],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const getUserName = (userId: number) => {
    return users?.find((u) => u.id === userId)?.name || "Unknown User";
  };

  const isLoading = isLoadingLeaves || isLoadingUsers;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Sales Executive Leaves</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Executive</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leave records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves?.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {getUserName(leave.userId)}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(leave.startDate), "PPP")}</TableCell>
                      <TableCell>{format(new Date(leave.endDate), "PPP")}</TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(leave.createdAt), "PPp")}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Approved
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
