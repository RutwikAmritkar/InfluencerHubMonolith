import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useCreateCampaign } from "@workspace/api-client-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const campaignSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.coerce.number().min(1, "Budget must be at least 1"),
  platform: z.string().min(1, "Please select a platform"),
  deliverables: z.string().optional(),
  targetAudience: z.string().optional(),
  timeline: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
});

export default function CampaignCreate() {
  const [, setLocation] = useLocation();
  const createCampaign = useCreateCampaign();

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema as any),
    defaultValues: {
      title: "",
      description: "",
      budget: 50000,
      platform: "instagram",
      deliverables: "",
      targetAudience: "",
      timeline: "",
      deadline: "",
    },
  });

  const onSubmit = (values: z.infer<typeof campaignSchema>) => {
    const isoDeadline = new Date(values.deadline).toISOString();

    createCampaign.mutate(
      { data: { ...values, deadline: isoDeadline } as any },
      {
        onSuccess: (data) => {
          toast.success("Campaign brief pre-funded and published successfully!");
          setLocation(`/campaigns/${data.id}`);
        },
        onError: () => {
          toast.error("Failed to create campaign brief.");
        },
      }
    );
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A] dark:text-[#FAF9F6]">
      {/* ─── 1. HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg border-[#E5E4DF] hover:bg-[#F2F1EC]"
          asChild
        >
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block mb-0.5">
            Pre-Funded Milestone Brief
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Create Campaign &amp;{" "}
            <span className="font-serif italic font-normal text-[#1D4ED8]">Milestone Terms</span>
          </h1>
          <p className="text-xs text-[#52525B] dark:text-slate-400 font-normal mt-0.5">
            Post an auditable campaign brief. Creator compensation is protected by milestone
            deliverables.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* ─── BASIC INFORMATION CARD ──────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white">
                Brief Specifications
              </h2>
              <p className="text-xs text-[#52525B] dark:text-slate-400 mt-0.5">
                The primary campaign description that vetted creators will review.
              </p>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                    Campaign Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Autumn Skincare Reel Showcase 2026"
                      className="text-xs border-[#E5E4DF] rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                    Creative Brief &amp; Product Narrative
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your brand values, hero product attributes, visual aesthetics, and specific hooks..."
                      className="min-h-[140px] text-xs border-[#E5E4DF] rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                      Campaign Budget (₹ INR)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        className="text-xs border-[#E5E4DF] rounded-lg font-tabular"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-[#52525B]">
                      Confirmed upon creator agreement.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                      Primary Social Platform
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-xs border-[#E5E4DF] rounded-lg">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass-dropdown">
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="multi">Cross-Platform</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ─── DELIVERABLES & TIMELINE CARD ────────────────────────────────── */}
          <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white">
                Deliverables &amp; Release Schedule
              </h2>
              <p className="text-xs text-[#52525B] dark:text-slate-400 mt-0.5">
                Exact milestone items required before funds disburse to creator accounts.
              </p>
            </div>

            <FormField
              control={form.control}
              name="deliverables"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                    Deliverable Scope
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. 1x 60s Instagram Reel (Dual Signoff), 2x Story Sets with Promo Link"
                      className="text-xs border-[#E5E4DF] rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                      Target Audience Demographics
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Females 18–34, Tier 1 Metros"
                        className="text-xs border-[#E5E4DF] rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                      Application Deadline
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="text-xs border-[#E5E4DF] rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ─── ACTION FOOTER ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/campaigns">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] hover:bg-[#F2F1EC] rounded-lg"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createCampaign.isPending}
              className="h-10 px-6 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              {createCampaign.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Locking Vault...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#059669]" />
                  <span>Publish &amp; Pre-Fund Brief</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
