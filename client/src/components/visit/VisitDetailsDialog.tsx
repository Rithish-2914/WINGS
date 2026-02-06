import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { MapPin, Phone, User, Calendar, FileText, CheckCircle2, BookOpen, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { Visit } from "@shared/schema";

interface VisitDetailsDialogProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: number) => void;
}

export function VisitDetailsDialog({ visit, open, onOpenChange, onDelete }: VisitDetailsDialogProps) {
  const { user } = useAuth();
  if (!visit) return null;

  const isAdmin = user?.role === 'admin';
  const books = Array.isArray(visit.booksSubmitted) ? visit.booksSubmitted : [];
  const metadata = visit.photoMetadata as { timestamp: string, lat: string, lng: string } | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">{visit.schoolName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Visit #{visit.visitCount || 1}
              </Badge>
              <Badge variant={visit.visitType === "First Visit" ? "default" : "secondary"}>
                {visit.visitType}
              </Badge>
            </div>
          </div>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {(() => {
              try {
                if (!visit.visitDate) return "No Date";
                // Parse date robustly to prevent RangeError
                const date = new Date(visit.visitDate);
                if (isNaN(date.getTime())) return "No Date";
                return format(date, "PPPP 'at' p");
              } catch (e) {
                return "No Date";
              }
            })()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mt-4">
          <div className="space-y-6 pb-4">
            {/* Photo Preview if available */}
            {visit.photoUrl && (
              <div className="space-y-2">
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={visit.photoUrl.startsWith('data:') ? visit.photoUrl : visit.photoUrl} 
                    alt="Visit" 
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error("Image load error for URL:", visit.photoUrl);
                      target.src = "https://placehold.co/600x400?text=Image+Load+Error";
                    }}
                  />
                </div>
                {metadata && metadata.timestamp && (
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Captured: {(() => {
                        try {
                          if (!metadata.timestamp) return "No Time";
                          const date = new Date(metadata.timestamp);
                          if (isNaN(date.getTime())) return "No Time";
                          return format(date, "h:mm:ss a");
                        } catch (e) {
                          return "No Time";
                        }
                      })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS: {metadata.lat ? Number(metadata.lat).toFixed(4) : "0.0000"}, {metadata.lng ? Number(metadata.lng).toFixed(4) : "0.0000"}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Location</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <span className="text-sm">{visit.address}, {visit.city} - {visit.pincode}</span>
                  </div>
                  {visit.schoolType && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Type: {visit.schoolType}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">{visit.contactPerson || "No contact person"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">{visit.contactMobile || visit.schoolPhone || "No contact number"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Status */}
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-5 w-5 ${visit.demoGiven ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">Demo Given</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-5 w-5 ${visit.sampleSubmitted ? "text-green-500" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">Samples Submitted</span>
              </div>
            </div>

            {/* Books Submitted */}
            {books.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Books Submitted
                </h3>
                <div className="flex flex-wrap gap-2">
                  {books.map((book: any, i: number) => (
                    <Badge key={i} variant="outline" className="bg-background">
                      {book}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Notes & Remarks
              </h3>
              <div className="space-y-4">
                {visit.mom && (
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block mb-1">MOM:</span>
                    <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">{visit.mom}</p>
                  </div>
                )}
                {visit.remarks && (
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block mb-1">Remarks:</span>
                    <p className="text-sm italic text-foreground/80 rounded-md border-l-4 border-primary/20 bg-primary/5 p-3">
                      "{visit.remarks}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {isAdmin && onDelete && (
          <DialogFooter className="border-t pt-4">
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={() => {
                if (confirm("Are you sure you want to delete this visit history? This action cannot be undone.")) {
                  onDelete(visit.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Visit History
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
