import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVisit, useUploadPhoto } from "@/hooks/use-visits";
import { insertVisitSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2, MapPin, Camera, Upload, Save, X, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

const formSchema = insertVisitSchema;
type VisitFormValues = z.infer<typeof formSchema>;

export default function VisitForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createVisit = useCreateVisit();
  const uploadPhoto = useUploadPhoto();
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSampleUploading, setIsSampleUploading] = useState(false);
  const [samplePhotoPreview, setSamplePhotoPreview] = useState<string | null>(null);
  const [bookInput, setBookInput] = useState("");

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitType: "First Visit",
      schoolName: "",
      principalName: "",
      phoneNumber: "",
      schoolType: "Primary",
      address: "",
      city: "",
      pincode: "",
      contactPerson: "",
      contactMobile: "",
      visitDate: new Date(),
      demoGiven: false,
      mom: "",
      remarks: "",
      followUpRequired: false,
      followUpDate: null,
      booksInterested: "",
      sampleSubmitted: false,
      booksSubmitted: [],
      products: [],
      visitCount: 1,
      photoUrl: "",
      locationLat: "",
      locationLng: "",
    },
  });

  const productList = [
    "Kinder box - Revised Edition1.0 (Term Books - Pack of 9)",
    "Kinder box - Premium Combo 2.0(Term Books - Pack of 14)",
    "Kinder Play (Term Books - Pack of 10)",
    "Special Edition - Economy Pack (Term Books -Pack of 6)",
    "My First Little Steps - Individual Books -Pack of 7"
  ];

  const getGeolocation = (): Promise<{lat: string, lng: string}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error("Geolocation not supported");
        toast({ variant: "destructive", title: "Error", description: err.message });
        reject(err);
        return;
      }
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = String(position.coords.latitude);
          const lng = String(position.coords.longitude);
          form.setValue("locationLat", lat);
          form.setValue("locationLng", lng);
          setGeoLoading(false);
          resolve({ lat, lng });
        },
        (error) => {
          setGeoLoading(false);
          toast({ variant: "destructive", title: "Location Error", description: error.message });
          reject(error);
        }
      );
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const coords = await getGeolocation();
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);

      const { url } = await uploadPhoto.mutateAsync(file);
      form.setValue("photoUrl", url);
      form.setValue("photoMetadata", {
        timestamp: new Date().toISOString(),
        lat: coords.lat,
        lng: coords.lng
      });
    } catch (error) {
      console.error("Capture failed", error);
    }
  };

  const handleSamplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSampleUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          "x-bucket-name": "samples"
        }
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setSamplePhotoPreview(url);
      form.setValue("samplePhotoUrl", url);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload sample photo" });
    } finally {
      setIsSampleUploading(false);
    }
  };

  const addBook = () => {
    if (!bookInput.trim()) return;
    const currentBooks = form.getValues("booksSubmitted") || [];
    form.setValue("booksSubmitted", [...currentBooks, bookInput.trim()]);
    setBookInput("");
  };

  const removeBook = (index: number) => {
    const currentBooks = form.getValues("booksSubmitted") || [];
    form.setValue("booksSubmitted", currentBooks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: VisitFormValues) => {
    console.log("Submitting form with data:", data);
    try {
      // If sample is submitted, we create the sample record too
      if (data.sampleSubmitted) {
        console.log("Submitting sample record...");
        try {
          await apiRequest("POST", "/api/samples", {
            schoolName: data.schoolName,
            booksSubmitted: data.booksSubmitted || [],
            photoUrl: data.samplePhotoUrl || data.photoUrl,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/samples"] });
        } catch (sampleErr) {
          console.error("Failed to create sample record (continuing anyway):", sampleErr);
          // We don't block visit creation if sample record fails
        }
      }

      console.log("Creating visit...");
      const visitData = {
        ...data,
        remarks: data.remarks || null,
        followUpDate: data.followUpDate || null,
        booksSubmitted: data.booksSubmitted || [],
        products: data.products || [],
      };
      
      await createVisit.mutateAsync(visitData);
      toast({ title: "Success", description: "Visit entry saved successfully" });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Failed to create visit:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create visit" 
      });
    }
  };

  const followUpRequired = form.watch("followUpRequired");

  // Debug form errors
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log("Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  return (
    <div className="container max-w-3xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Visit Entry</h1>
        <p className="text-muted-foreground">Log details for your school visit.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>School Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="visitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="First Visit">First Visit</SelectItem>
                        <SelectItem value="Re-Visit">Re-Visit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schoolType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pre school">Pre school</SelectItem>
                        <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="High School">High School</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
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
              </div>

              <FormField
                control={form.control}
                name="principalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter principal name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit phone number" {...field} value={field.value || ""} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address, Area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="Numerical pincode" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <FormLabel>GPS Location</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="locationLat"
                      render={({ field }) => (
                        <Input placeholder="Latitude" readOnly {...field} />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locationLng"
                      render={({ field }) => (
                        <Input placeholder="Longitude" readOnly {...field} />
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="w-full" 
                    onClick={getGeolocation}
                    disabled={geoLoading}
                  >
                    {geoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Capture Current Location
                  </Button>
                </div>

                <div className="space-y-4">
                  <FormLabel>Visit Photo</FormLabel>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors relative">
                    {photoPreview ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md">
                        <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setPhotoPreview(null);
                            form.setValue("photoUrl", "");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4 flex flex-col items-center gap-4">
                          <Button
                            type="button"
                            size="lg"
                            className="relative"
                            onClick={() => document.getElementById('camera-capture')?.click()}
                            disabled={geoLoading || uploadPhoto.isPending}
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Open Camera
                            <input 
                              id="camera-capture" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              capture="environment"
                              onChange={handleFileChange}
                            />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of person met" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit mobile" {...field} value={field.value || ""} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="mom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutes of Meeting (MOM)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed discussion points..." 
                          className="min-h-[120px]"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Quick summary..." 
                          className="min-h-[80px]"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormLabel className="mb-4 block">Products Interested</FormLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {productList.map((product) => (
                    <div
                      key={product}
                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                    >
                      <FormControl>
                        <Checkbox
                          checked={!!(form.watch("products") || []).includes(product)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("products") || [];
                            if (checked) {
                              form.setValue("products", [...current, product]);
                            } else {
                              form.setValue("products", current.filter((p) => p !== product));
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal leading-tight">
                        {product}
                      </FormLabel>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={!!form.watch("demoGiven")}
                    onCheckedChange={field => form.setValue("demoGiven", !!field)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Demo Given</FormLabel>
                </div>
              </div>

              <div className="flex flex-col items-start space-y-4 rounded-md border p-4">
                <div className="flex items-center space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={!!form.watch("sampleSubmitted")}
                      onCheckedChange={field => form.setValue("sampleSubmitted", !!field)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Samples Submitted</FormLabel>
                  </div>
                </div>

                {form.watch("sampleSubmitted") && (
                  <div className="w-full space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <FormLabel>Books Provided</FormLabel>
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
                        {(form.watch("booksSubmitted") || []).map((book, i) => (
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
                      <FormLabel>Photo of Samples</FormLabel>
                      {samplePhotoPreview ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={samplePhotoPreview} alt="Sample Proof" className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setSamplePhotoPreview(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                            <Camera className="h-6 w-6 mb-2" />
                            <span className="text-xs">Take Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              className="hidden" 
                              onChange={handleSamplePhotoUpload}
                              disabled={isSampleUploading}
                            />
                          </label>
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                            <Upload className="h-6 w-6 mb-2" />
                            <span className="text-xs">Gallery</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleSamplePhotoUpload}
                              disabled={isSampleUploading}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="followUpRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Follow-up Required?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {followUpRequired && (
                <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
                  <FormField
                    control={form.control}
                    name="followUpDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Next Follow-up Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={createVisit.isPending || geoLoading || uploadPhoto.isPending || isSampleUploading}>
            {createVisit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Visit Entry
          </Button>
        </form>
      </Form>
    </div>
  );
}