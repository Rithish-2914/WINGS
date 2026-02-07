import { useState, useMemo } from "react";
import { useVisits } from "@/hooks/use-visits";
import { format, subDays, isSameDay } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Download, Search, FileText, Users, School, Eye, User as UserIcon, Target as TargetIcon, Plus, UserPlus, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { VisitDetailsDialog } from "@/components/visit/VisitDetailsDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Visit, User, Target } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [targetExecId, setTargetExecId] = useState<string>("");
  const [targetCount, setTargetCount] = useState<string>("5");
  const [targetDate, setTargetDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [targetRemarks, setTargetRemarks] = useState<string>("");

  // New User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "executive">("executive");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteVisitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete visit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Visit Deleted", description: "The visit record has been removed." });
      setIsDetailsOpen(false);
    }
  });

  const setTargetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to set target");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/targets"] });
      toast({ title: "Target Set", description: "The daily target has been assigned." });
      setIsTargetDialogOpen(false);
      setTargetRemarks("");
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User Created", description: "New user has been successfully registered." });
      setIsUserDialogOpen(false);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateUser = () => {
    if (!newUserName || !newUserUsername || !newUserPassword) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      name: newUserName,
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole
    });
  };

  const handleSetTarget = () => {
    if (!targetExecId) return;
    setTargetMutation.mutate({
      executiveId: Number(targetExecId),
      targetVisits: Number(targetCount),
      targetDate: new Date(targetDate),
      remarks: targetRemarks
    });
  };

  // In a real app, date range picker would be here
  const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");
  
  const { data: visits, isLoading: visitsLoading } = useVisits({ 
    startDate, 
    endDate,
    userId: selectedUserId === "all" ? undefined : Number(selectedUserId)
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: targets, isLoading: targetsLoading } = useQuery<Target[]>({
    queryKey: ["/api/targets"],
  });

  const isLoading = visitsLoading || usersLoading || targetsLoading;

  // Filter logic
  const filteredVisits = useMemo(() => {
    return visits?.filter(visit => 
      visit.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.city.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [visits, searchTerm]);

  // Executive stats for the current day and overall
  const executiveStats = useMemo(() => {
    if (!users || !visits) return [];
    
    return users
      .filter(u => u.role === 'executive')
      .map(user => {
        const userVisits = visits.filter(v => v.userId === user.id);
        const todayVisits = userVisits.filter(v => isSameDay(new Date(v.visitDate), new Date()));
        const userTarget = targets?.find(t => t.executiveId === user.id && isSameDay(new Date(t.targetDate), new Date()));
        
        return {
          ...user,
          totalVisits: userVisits.length,
          revisits: userVisits.filter(v => v.visitType === 'Re-Visit').length,
          todayCount: todayVisits.length,
          target: userTarget?.targetVisits || 0
        };
      });
  }, [users, visits, targets]);

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  };

  // Stats calculation
  const totalVisits = filteredVisits.length;
  const uniqueSchools = new Set(filteredVisits.map(v => v.schoolName)).size;
  const demosGiven = filteredVisits.filter(v => v.demoGiven).length;

  // Chart data preparation
  const chartData = filteredVisits.reduce((acc: any[], visit) => {
    const date = format(new Date(visit.visitDate), "MM/dd");
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleExport = () => {
    const headers = ["Date", "School", "City", "Type", "Contact", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...filteredVisits.map(v => [
        format(new Date(v.visitDate), "yyyy-MM-dd"),
        `"${v.schoolName}"`,
        `"${v.city}"`,
        v.visitType,
        `"${v.contactPerson}"`,
        `"${v.remarks || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `visits_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="container p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of field activities for the last 30 days
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    placeholder="Enter full name"
                    value={newUserName} 
                    onChange={(e) => setNewUserName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username / Login ID</label>
                  <Input 
                    placeholder="Enter login ID"
                    value={newUserUsername} 
                    onChange={(e) => setNewUserUsername(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input 
                    type="password"
                    placeholder="Enter password"
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newUserRole} onValueChange={(val: any) => setNewUserRole(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Sales Executive</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TargetIcon className="h-4 w-4" />
                Set Daily Targets
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Daily Target</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sales Executive</label>
                  <Select value={targetExecId} onValueChange={setTargetExecId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select executive" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => u.role === 'executive').map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Visits</label>
                  <Input 
                    type="number" 
                    value={targetCount} 
                    onChange={(e) => setTargetCount(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Date</label>
                  <Input 
                    type="date" 
                    value={targetDate} 
                    onChange={(e) => setTargetDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks / Instructions</label>
                  <Textarea 
                    placeholder="E.g. Focus on schools in South Extension today..."
                    value={targetRemarks}
                    onChange={(e) => setTargetRemarks(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSetTarget} disabled={setTargetMutation.isPending}>
                  {setTargetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Target
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Executives</SelectItem>
              {users?.filter(u => u.role === 'executive').map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Executive Performance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {executiveStats.map(exec => (
          <Card key={exec.id} className="hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => setSelectedUserId(exec.id.toString())}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-primary" />
                  {exec.name}
                </div>
                {exec.target > 0 && (
                   <Badge variant={exec.todayCount >= exec.target ? "default" : "secondary"} className="text-[10px]">
                     {exec.todayCount}/{exec.target} Target
                   </Badge>
                )}
              </CardTitle>
              <CardDescription>ID: {exec.username}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{exec.totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline" className="text-[10px]">{exec.todayCount} Today</Badge>
                  <p className="text-[10px] text-muted-foreground">{exec.revisits} Re-visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Visits"
          value={isLoading ? "..." : totalVisits}
          icon={FileText}
          className="border-l-indigo-500"
        />
        <StatCard
          title="Unique Schools"
          value={isLoading ? "..." : uniqueSchools}
          icon={School}
          className="border-l-purple-500"
        />
        <StatCard
          title="Demos Given"
          value={isLoading ? "..." : demosGiven}
          icon={Users}
          className="border-l-pink-500"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Trends</CardTitle>
          <CardDescription>Daily visit volume over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Visits</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search schools or cities..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Executive</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No visits found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => {
                    const exec = users?.find(u => u.id === visit.userId);
                    return (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          {format(new Date(visit.visitDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{exec?.name || "Missing User"}</span>
                            <span className="text-[10px] text-muted-foreground">ID: {exec?.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{visit.schoolName}</TableCell>
                        <TableCell>{visit.city}</TableCell>
                        <TableCell>
                          <Badge variant={visit.visitType === "First Visit" ? "default" : "secondary"}>
                            {visit.visitType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewVisit(visit)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VisitDetailsDialog 
        visit={selectedVisit} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
        onDelete={(id) => deleteVisitMutation.mutate(id)}
      />
    </div>
  );
}
