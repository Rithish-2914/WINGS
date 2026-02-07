import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVisit, useUploadPhoto } from "@/hooks/use-visits";
import { insertVisitSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2, MapPin, Camera, Upload, Save, X } from "lucide-react";
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

// Extend schema for form usage if needed, or use as is
const formSchema = insertVisitSchema;
type VisitFormValues = z.infer<typeof formSchema>;

export default function VisitForm() {
  const [, setLocation] = useLocation();
  const createVisit = useCreateVisit();
  const uploadPhoto = useUploadPhoto();
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitType: "First Visit",
      schoolName: "",
      schoolType: "Primary",
      address: "",
      city: "",
      pincode: "",
      contactPerson: "",
      contactMobile: "",
      visitDate: new Date(),
      demoGiven: false,
      sampleSubmitted: false,
      booksSubmitted: [],
      products: [],
      visitCount: 1,
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
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = String(position.coords.latitude);
          const lng = String(position.coords.longitude);
          form.setValue("locationLat", lat);
          form.setValue("locationLng", lng);
          resolve({ lat, lng });
        },
        (error) => reject(error)
      );
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGeoLoading(true);
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
      alert("Please enable location services to take a photo.");
      setPhotoPreview(null);
    } finally {
      setGeoLoading(false);
    }
  };

  const onSubmit = async (data: VisitFormValues) => {
    // Ensure array format for books submitted if empty
    if (!data.booksSubmitted) {
      data.booksSubmitted = [];
    }
    if (!data.products) {
      data.products = [];
    }
    
    try {
      await createVisit.mutateAsync(data);
      setLocation("/dashboard");
    } catch (error) {
      console.error("Failed to create visit:", error);
    }
  };

  return (
    <div className="container max-w-3xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">New Visit Entry</h1>
        <p className="text-muted-foreground">Log details for your school visit.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Basic Details */}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                    <FormDescription>How many times have you visited this school?</FormDescription>
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
                      <Input placeholder="Pincode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Location & Photo */}
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
                        <Input placeholder="Latitude" readOnly {...field} value={field.value || ""} />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locationLng"
                      render={({ field }) => (
                        <Input placeholder="Longitude" readOnly {...field} value={field.value || ""} />
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
                            form.setValue("photoUrl", null);
                            form.setValue("photoMetadata", null);
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
                          <p className="text-sm text-muted-foreground">
                            Take a photo of the school to verify your visit.
                          </p>
                        </div>
                        <p className="mt-4 text-xs text-gray-500 italic">
                          Location and timestamp will be automatically tagged.
                        </p>
                      </div>
                    )}
                    {(uploadPhoto.isPending || geoLoading) && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-sm font-medium">
                            {geoLoading ? "Tagging location..." : "Uploading..."}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Contact & Meeting */}
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
                      <Input placeholder="10-digit mobile" {...field} value={field.value || ""} />
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
                      <FormLabel>Remarks / Feedback</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Quick summary or next steps..." 
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

              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={form.watch("demoGiven") || false}
                    onCheckedChange={field => form.setValue("demoGiven", !!field)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Demo Given</FormLabel>
                  <FormDescription>
                    Check if a product demonstration was conducted.
                  </FormDescription>
                </div>
              </div>

              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={form.watch("sampleSubmitted") || false}
                    onCheckedChange={field => form.setValue("sampleSubmitted", !!field)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Samples Submitted</FormLabel>
                  <FormDescription>
                    Check if any book samples were left at the school.
                  </FormDescription>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <FormLabel>Products Selected</FormLabel>
                <div className="grid gap-2">
                  {productList.map((product) => (
                    <div key={product} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={(form.watch("products") || []).includes(product)}
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
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          {product}
                        </FormLabel>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end pb-8">
            <Button type="button" variant="outline" onClick={() => setLocation("/dashboard")}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className="min-w-[150px]"
              disabled={createVisit.isPending || uploadPhoto.isPending}
            >
              {createVisit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
