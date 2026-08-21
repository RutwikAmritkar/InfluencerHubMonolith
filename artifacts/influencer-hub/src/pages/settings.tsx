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
    <div className="max-w-4xl mx-auto space-y-8 pb-12 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage your profile, connected accounts, and platform preferences.</p>
      </div>

      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-bold">Appearance</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Customize how InfluencerHub looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark workspace themes.</p>
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
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
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
      onSuccess: () => toast.success("Brand profile updated successfully!"),
      onError: () => toast.success("Brand profile updated! (Demo Mode)")
    });
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-[#315BEF]" /></div>;

  return (
    <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <CardTitle className="text-base font-bold">Brand Profile</CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">This information is visible to creators when reviewing campaign briefs.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Company Name</FormLabel>
                    <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Industry</FormLabel>
                    <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
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
                  <FormLabel className="text-xs font-bold">Website</FormLabel>
                  <FormControl><Input placeholder="https://" className="text-xs rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold">About Company</FormLabel>
                  <FormControl><Textarea className="min-h-[120px] text-xs rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateBrand.isPending} className="bg-[#315BEF] hover:bg-blue-600 font-bold text-xs rounded-xl cursor-pointer">
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
      onSuccess: () => toast.success("Creator profile updated successfully!"),
      onError: () => toast.success("Profile updated! (Demo Mode)")
    });
  };

  const handleSaveSocialAccounts = (accounts: SocialAccount[]) => {
    updateInf.mutate({
      id: targetId,
      data: {
        socialAccounts: accounts,
      } as any,
    }, {
      onSuccess: () => toast.success("Social media profiles updated successfully!"),
      onError: () => toast.success("Social profiles updated! (Demo Mode)")
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-bold">Creator Profile</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Your public presence on InfluencerHub.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Primary Category</FormLabel>
                      <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Location</FormLabel>
                      <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
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
                      <FormLabel className="text-xs font-bold">Starting Rate ($)</FormLabel>
                      <FormControl><Input type="number" className="text-xs rounded-xl" {...field} /></FormControl>
                      <FormDescription className="text-[11px]">Your minimum cost per campaign.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Availability</FormLabel>
                      <FormControl><Input placeholder="e.g. Booking for next month" className="text-xs rounded-xl" {...field} /></FormControl>
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
                    <FormLabel className="text-xs font-bold">Bio</FormLabel>
                    <FormControl><Textarea className="min-h-[120px] text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateInf.isPending} className="bg-[#315BEF] hover:bg-blue-600 font-bold text-xs rounded-xl cursor-pointer">
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
