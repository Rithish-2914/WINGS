import { useAuth } from "@/hooks/use-auth";
import { useVisits } from "@/hooks/use-visits";
import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  Filter,
  Search as SearchIcon,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { VisitDetailsDialog } from "@/components/visit/VisitDetailsDialog";
import type { Visit } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { data: visits, isLoading } = useVisits({ 
    userId: user?.id
  });

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsOpen(true);
  };

  const filteredVisits = visits?.filter(v => 
    (v.schoolName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.remarks && v.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visit History</h1>
        <p className="text-muted-foreground mt-1">
          View all your past school visits and meetings.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by school name, city, or remarks..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Filter className="h-4 w-4" />
          <span>{filteredVisits?.length || 0} Visits</span>
        </div>
      </div>

      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Full History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredVisits?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No visits found</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchTerm ? "Try adjusting your search terms." : "You haven't logged any visits yet."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredVisits?.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors group relative overflow-hidden"
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{visit.schoolName}</h4>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {visit.visitType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-medium">
                            {(() => {
                              try {
                                const date = new Date(visit.visitDate);
                                if (isNaN(date.getTime())) return "Invalid Date";
                                return format(date, "MMM do, yyyy • h:mm a");
                              } catch (e) {
                                return "Invalid Date";
                              }
                            })()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleViewVisit(visit)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {visit.city} • {visit.address}
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

      <VisitDetailsDialog 
        visit={selectedVisit} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </div>
  );
}

// Helper to keep the component clean
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
