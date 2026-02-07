import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSampleSubmissionSchema, type InsertSampleSubmission } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SampleSubmission() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bookInput, setBookInput] = useState("");

  const form = useForm<InsertSampleSubmission>({
    resolver: zodResolver(insertSampleSubmissionSchema),
    defaultValues: {
      schoolName: "",
      booksSubmitted: [],
      photoUrl: "",
    },
  });

  const books = form.watch("booksSubmitted") || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      form.setValue("photoUrl", url);
      setPreviewUrl(url);
      toast({ title: "Success", description: "Photo uploaded successfully" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to upload photo" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: InsertSampleSubmission) => {
    try {
      await apiRequest("POST", "/api/samples", data);
      queryClient.invalidateQueries({ queryKey: ["/api/samples"] });
      toast({ title: "Success", description: "Sample submitted successfully" });
      setLocation("/dashboard");
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to submit sample" 
      });
    }
  };

  const addBook = () => {
    if (!bookInput.trim()) return;
    form.setValue("booksSubmitted", [...books, bookInput.trim()]);
    setBookInput("");
  };

  const removeBook = (index: number) => {
    form.setValue("booksSubmitted", books.filter((_, i) => i !== index));
  };

  return (
    <div className="container max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit Sample</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter school name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Books Submitted</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter book name" 
                    value={bookInput}
                    onChange={(e) => setBookInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBook())}
                  />
                  <Button type="button" size="icon" onClick={addBook}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {books.map((book, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {book}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeBook(i)} 
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Photo of Sample</FormLabel>
                <div className="flex flex-col gap-4">
                  {previewUrl ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewUrl(null);
                          form.setValue("photoUrl", "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                        <Camera className="h-8 w-8 mb-2" />
                        <span className="text-sm">Take Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          className="hidden" 
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">Gallery</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  )}
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  <FormMessage>{form.formState.errors.photoUrl?.message}</FormMessage>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={form.formState.isSubmitting || isUploading}
              >
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Sample
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
