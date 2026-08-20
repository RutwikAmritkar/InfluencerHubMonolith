import { useAuth } from "@/contexts/auth-context";
import { useGetBrand, useUpdateBrand, useGetInfluencer, useUpdateInfluencer, SocialAccount } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { SocialAccountsForm } from "@/components/social-accounts-form";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Card className="shadow-sm border-muted">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how InfluencerHub looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Dark Mode</label>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
            />
          </div>
        </CardContent>
      </Card>

      {user?.role === "brand" ? (
        <BrandProfileForm profileId={user.profileId || 1} />
      ) : (
        <InfluencerProfileForm profileId={user?.profileId || 1} />
      )}
    </div>
  );
}

const brandSchema = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  description: z.string().optional(),
  website: z.string().optional(),
});

function BrandProfileForm({ profileId }: { profileId: number }) {
  const { data: brand, isLoading } = useGetBrand(profileId, { query: { enabled: !!profileId } as any });
  const updateBrand = useUpdateBrand();

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    values: {
      name: brand?.name || "",
      industry: brand?.industry || "",
      description: brand?.description || "",
      website: brand?.website || "",
    },
  });

  const onSubmit = (values: z.infer<typeof brandSchema>) => {
    updateBrand.mutate({ id: profileId, data: values }, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: () => toast.error("Failed to update profile")
    });
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader>
        <CardTitle>Brand Profile</CardTitle>
        <CardDescription>This information is visible to creators.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl><Input placeholder="https://" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Company</FormLabel>
                  <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateBrand.isPending}>
              {updateBrand.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const infSchema = z.object({
  bio: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  collaborationCost: z.coerce.number().optional(),
  availability: z.string().optional(),
});

function InfluencerProfileForm({ profileId }: { profileId: number }) {
  const targetId = profileId || 1;
  const { data: inf, isLoading } = useGetInfluencer(targetId, { query: { enabled: true } as any });
  const updateInf = useUpdateInfluencer();

  const form = useForm<z.infer<typeof infSchema>>({
    resolver: zodResolver(infSchema),
    values: {
      bio: inf?.bio || "",
      category: inf?.category || "",
      country: inf?.country || "",
      collaborationCost: inf?.collaborationCost || 0,
      availability: inf?.availability || "",
    },
  });

  const onSubmit = (values: z.infer<typeof infSchema>) => {
    updateInf.mutate({ id: targetId, data: values }, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: () => toast.error("Failed to update profile")
    });
  };

  const handleSaveSocialAccounts = (accounts: SocialAccount[]) => {
    updateInf.mutate({
      id: targetId,
      data: {
        socialAccounts: accounts,
      } as any,
    }, {
      onSuccess: () => toast.success("Social media profiles updated successfully"),
      onError: () => toast.error("Failed to update social profiles")
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-sm border-muted">
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
          <CardDescription>Your public presence on InfluencerHub.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Category</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="collaborationCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Rate ($)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormDescription>Your minimum cost for a campaign.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl><Input placeholder="e.g. Booking for next month" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateInf.isPending}>
                {updateInf.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dedicated Social Media Section */}
      <SocialAccountsForm
        creatorId={targetId}
        initialAccounts={inf?.socialAccounts || []}
        onSave={handleSaveSocialAccounts}
        mode="settings"
        isSaving={updateInf.isPending}
      />
    </div>
  );
}
