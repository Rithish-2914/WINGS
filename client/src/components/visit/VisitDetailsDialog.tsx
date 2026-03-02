import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { MapPin, Phone, User, Calendar, FileText, CheckCircle2, BookOpen, Clock, Trash2, Send, X as XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Visit } from "@shared/schema";

interface VisitDetailsDialogProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: number) => void;
}

export function VisitDetailsDialog({ visit, open, onOpenChange, onDelete }: VisitDetailsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followUpText, setFollowUpText] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const followUpMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!visit) return;
      const res = await fetch(`/api/visits/${visit.id}/follow-up`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminFollowUp: text }),
      });
      if (!res.ok) throw new Error("Failed to send follow-up");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
      toast({ title: "Follow-up Sent", description: "Your remark has been sent to the executive." });
      setFollowUpText("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

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
                const d = typeof visit.visitDate === 'string' ? new Date(visit.visitDate) : visit.visitDate;
                const date = new Date(d);
                if (isNaN(date.getTime())) return "No Date";
                return format(date, "PPPP 'at' p");
              } catch (e) {
                return "No Date";
              }
            })()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mt-4 overflow-y-auto">
          <div className="space-y-6 pb-4">
            {/* Photo Preview if available */}
            {visit.photoUrl && (
              <div className="space-y-2">
                <div 
                  className="relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-zoom-in"
                  onClick={() => setZoomImage(visit.photoUrl)}
                >
                  <img 
                    src={visit.photoUrl} 
                    alt="Visit" 
                    className="object-contain w-full h-full"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400?text=Image+Not+Found+on+Server";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">Click to Zoom</span>
                  </div>
                </div>
                {metadata && metadata.timestamp && (
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Captured: {(() => {
                        try {
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
              {/* School Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">School Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Visit Type: {visit.visitType}</span>
                  </div>
                  {visit.schoolType && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">School Type: {visit.schoolType}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">Visit Count: {visit.visitCount || 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">School Name: {visit.schoolName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">Principal Name: {visit.principalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">School Phone: {visit.schoolPhone || visit.phoneNumber}</span>
                  </div>
                  {visit.currentBooksUsed && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="text-sm">Current Books: {visit.currentBooksUsed}</span>
                    </div>
                  )}
                  {visit.modeOfBooks && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">Mode: {visit.modeOfBooks}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <div className="text-sm">
                      <p>Address: {visit.address}</p>
                      <p>City: {visit.city}</p>
                      <p>Pincode: {visit.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Contact Person</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">Contact Person: {visit.contactPerson || "No contact person"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">Mobile Number: {visit.contactMobile || "No mobile number"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Location & Evidence</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">GPS Location</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p>Latitude: {visit.locationLat}</p>
                    <p>Longitude: {visit.locationLng}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Meeting Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${visit.demoGiven ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className="text-sm">Demo Given: {visit.demoGiven ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${visit.sampleSubmitted ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className="text-sm">Samples Submitted: {visit.sampleSubmitted ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Products Interested</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(visit.products) && visit.products.length > 0 ? (
                      visit.products.map((product: any, i: number) => (
                        <Badge key={i} variant="secondary">
                          {product}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No products selected</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Follow-up</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${visit.followUpRequired ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">Follow-up Required: {visit.followUpRequired ? "Yes" : "No"}</span>
                    </div>
                    {visit.followUpDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Follow-up Date: {format(new Date(visit.followUpDate), "PPP")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Books Section */}
              {visit.sampleSubmitted && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Books Provided (Samples)
                  </h3>
                  {books.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {books.map((book: any, i: number) => (
                        <Badge key={i} variant="outline" className="bg-background">
                          {book}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No specific books listed</p>
                  )}
                  
                  {visit.samplePhotoUrl && (
                    <div className="mt-3">
                      <span className="text-xs font-bold text-muted-foreground block mb-2">Sample Proof Photo:</span>
                      <div 
                        className="relative aspect-video rounded-lg overflow-hidden border bg-muted max-w-sm cursor-zoom-in"
                        onClick={() => setZoomImage(visit.samplePhotoUrl)}
                      >
                        <img 
                          src={visit.samplePhotoUrl} 
                          alt="Sample Proof" 
                          className="object-contain w-full h-full"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Sample+Photo+Not+Found";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">Click to Zoom</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Zoom Modal */}
              <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
                  <div className="relative w-full h-[80vh]">
                    <img 
                      src={zoomImage || ""} 
                      className="w-full h-full object-contain"
                      alt="Zoomed"
                    />
                    <Button 
                      className="absolute top-2 right-2 rounded-full h-10 w-10 p-0" 
                      variant="secondary"
                      onClick={() => setZoomImage(null)}
                    >
                      <XIcon className="h-6 w-6" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* MOM & Remarks */}
              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Minutes of Meeting (MOM)
                </h3>
                <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                  {visit.mom || "No notes recorded"}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Remarks (Optional)</h3>
                <p className="text-sm italic text-foreground/80 rounded-md border-l-4 border-primary/20 bg-primary/5 p-3">
                  {visit.remarks ? `"${visit.remarks}"` : "No remarks provided"}
                </p>
              </div>

              {visit.adminFollowUp && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">Admin Follow-up Remark:</span>
                  <p className="text-sm italic text-amber-900 dark:text-amber-100 rounded-md border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3">
                    "{visit.adminFollowUp}"
                  </p>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-2 pt-4 border-t">
                  <span className="text-xs font-bold text-muted-foreground block">Send Follow-up to Executive:</span>
                  <Textarea 
                    placeholder="Type follow-up instructions for the executive..."
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => followUpMutation.mutate(followUpText)}
                    disabled={!followUpText || followUpMutation.isPending}
                  >
                    {followUpMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Follow-up Remark
                  </Button>
                </div>
              )}
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
