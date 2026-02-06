import { useAuth } from "@/hooks/use-auth";
import { useVisits } from "@/hooks/use-visits";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Plus, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Briefcase,
  Eye,
  Target as TargetIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { VisitDetailsDialog } from "@/components/visit/VisitDetailsDialog";
import { useQuery } from "@tanstack/react-query";
import type { Visit, Target } from "@shared/schema";

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Fetch today's visits
  const { data: visits, isLoading } = useVisits({ 
    userId: user?.id,
    startDate: dateStr, 
    endDate: dateStr 
  });

  // Fetch today's targets
  const { data: targets } = useQuery<Target[]>({
    queryKey: ["/api/targets", { executiveId: user?.id, date: dateStr }],
    queryFn: async () => {
      const res = await fetch(`/api/targets?executiveId=${user?.id}&date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to fetch targets");
      return res.json();
    }
  });

  const dailyTarget = targets && targets.length > 0 ? targets[0].targetVisits : 0;
  const targetRemarks = targets && targets.length > 0 ? (targets[0] as any).remarks : null;

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  };

  // Sort visits by date descending for the timeline
  const sortedVisits = visits ? [...visits].sort((a, b) => 
    new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  ) : [];

  const totalVisits = visits?.length || 0;
  const reVisits = visits?.filter(v => v.visitType === "Re-Visit").length || 0;
  const newVisits = visits?.filter(v => v.visitType === "First Visit").length || 0;

  return (
    <div className="container p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {format(today, "EEEE, MMMM do, yyyy")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {dailyTarget > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20">
                <TargetIcon className="h-5 w-5" />
                Target: {totalVisits}/{dailyTarget}
              </div>
            )}
            <Link href="/visits/new">
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" />
                New Visit Entry
              </Button>
            </Link>
          </div>
          {targetRemarks && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-2 rounded text-xs max-w-xs italic text-right">
              Admin note: "{targetRemarks}"
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Visits Today"
          value={isLoading ? "..." : totalVisits}
          icon={CheckCircle2}
          className="border-l-blue-500"
        />
        <StatCard
          title="New Clients"
          value={isLoading ? "..." : newVisits}
          icon={Briefcase}
          className="border-l-green-500"
        />
        <StatCard
          title="Follow-ups"
          value={isLoading ? "..." : reVisits}
          icon={Clock}
          className="border-l-orange-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="col-span-1 shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : totalVisits === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No visits logged today</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start your day by logging your first school visit using the button above.
                </p>
                <Link href="/visits/new">
                  <Button variant="outline">Start Logging</Button>
                </Link>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sortedVisits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors group relative overflow-hidden"
                      onClick={() => handleViewVisit(visit)}
                    >
                      <div className="flex-none">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          {visit.photoUrl ? (
                            <AvatarImage src={visit.photoUrl} alt={visit.schoolName} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {visit.schoolName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-base">{visit.schoolName}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
                              {format(new Date(visit.visitDate), "h:mm a")}
                            </span>
                            <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {visit.city} • {visit.visitType}
                        </p>
                        {visit.remarks && (
                          <p className="text-sm mt-2 p-2 bg-muted/30 rounded text-foreground/80 italic border-l-2 border-primary/20">
                            "{visit.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <VisitDetailsDialog 
        visit={selectedVisit} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </div>
  );
}
