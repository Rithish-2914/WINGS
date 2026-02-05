import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { MapPin, Phone, User, Calendar, FileText, CheckCircle2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Visit } from "@shared/schema";

interface VisitDetailsDialogProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisitDetailsDialog({ visit, open, onOpenChange }: VisitDetailsDialogProps) {
  if (!visit) return null;

  const books = Array.isArray(visit.booksSubmitted) ? visit.booksSubmitted : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">{visit.schoolName}</DialogTitle>
            <Badge variant={visit.visitType === "First Visit" ? "default" : "secondary"}>
              {visit.visitType}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(visit.visitDate), "PPPP 'at' p")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4 mt-4">
          <div className="space-y-6 pb-4">
            {/* Photo Preview if available */}
            {visit.photoUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <img 
                  src={visit.photoUrl} 
                  alt="Visit" 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center justify-center w-full h-full text-muted-foreground bg-muted';
                      fallback.innerHTML = '<span>Image could not be loaded</span>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
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
      </DialogContent>
    </Dialog>
  );
}
