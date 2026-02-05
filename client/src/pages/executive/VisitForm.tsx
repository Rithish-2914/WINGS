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
      visitDate: new Date(), // Fixed: Should be Date object, not string
      demoGiven: false,
      sampleSubmitted: false,
      booksSubmitted: [],
    },
  });

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("locationLat", String(position.coords.latitude));
        form.setValue("locationLng", String(position.coords.longitude));
        setGeoLoading(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        setGeoLoading(false);
      }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    try {
      // Upload immediately
      const { url } = await uploadPhoto.mutateAsync(file);
      form.setValue("photoUrl", url);
    } catch (error) {
      console.error("Upload failed", error);
      setPhotoPreview(null);
    }
  };

  const onSubmit = (data: VisitFormValues) => {
    // Ensure array format for books submitted if empty
    if (!data.booksSubmitted) {
      data.booksSubmitted = [];
    }
    createVisit.mutate(data);
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
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                          >
                            <span>Upload a file</span>
                            <input 
                              id="file-upload" 
                              name="file-upload" 
                              type="file" 
                              className="sr-only" 
                              accept="image/*"
                              capture="environment"
                              onChange={handleFileChange}
                              disabled={uploadPhoto.isPending}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                    {uploadPhoto.isPending && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks / Feedback</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Summary of discussion..." 
                          className="min-h-[100px]"
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
