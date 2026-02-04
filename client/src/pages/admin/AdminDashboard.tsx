import { useState } from "react";
import { useVisits } from "@/hooks/use-visits";
import { format, subDays } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { FileText, Users, School } from "lucide-react";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  // In a real app, date range picker would be here
  const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");
  
  const { data: visits, isLoading } = useVisits({ startDate, endDate });

  // Filter logic
  const filteredVisits = visits?.filter(visit => 
    visit.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.city.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
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
                  <TableHead>School Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
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
                  filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {format(new Date(visit.visitDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{visit.schoolName}</TableCell>
                      <TableCell>{visit.city}</TableCell>
                      <TableCell>
                        <Badge variant={visit.visitType === "First Visit" ? "default" : "secondary"}>
                          {visit.visitType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {visit.demoGiven && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Demo</Badge>}
                          {visit.sampleSubmitted && <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Sample</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
