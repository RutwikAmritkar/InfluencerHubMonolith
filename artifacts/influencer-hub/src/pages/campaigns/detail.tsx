import { useGetCampaign, getGetCampaignQueryKey, useListApplications, getListApplicationsQueryKey, useCreateApplication, useUpdateApplication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, DollarSign, Target, CheckCircle2, XCircle, Clock, Megaphone, Users } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pitchMessage, setPitchMessage] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { data: campaign, isLoading } = useGetCampaign(id, {
    query: {
      enabled: !!id,
      queryKey: getGetCampaignQueryKey(id),
    }
  });

  const { data: applications, isLoading: appsLoading } = useListApplications(
    { campaignId: id },
    {
      query: {
        enabled: !!id && user?.role === 'brand', // Only brand needs to see all applications
        queryKey: getListApplicationsQueryKey({ campaignId: id })
      }
    }
  );

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const handleApply = () => {
    createApplication.mutate(
      { data: { campaignId: id, message: pitchMessage } },
      {
        onSuccess: () => {
          toast.success("Application submitted successfully!");
          setIsApplyOpen(false);
          // Assuming the influencer applications list is somewhere else, or we refetch
        },
        onError: () => {
          toast.error("Failed to submit application.");
        }
      }
    );
  };

  const handleUpdateAppStatus = (appId: number, status: 'accepted' | 'rejected') => {
    updateApplication.mutate(
      { id: appId, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Application ${status}.`);
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({ campaignId: id }) });
        },
        onError: () => {
          toast.error("Failed to update status.");
        }
      }
    );
  };

  if (isLoading || !campaign) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-teal-500 hover:bg-teal-600">Active</Badge>;
      case 'completed': return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="h-5 w-5 text-teal-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-rose-500" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-muted-foreground">Posted by <span className="font-medium text-foreground">{campaign.brandName}</span></p>
        </div>
        {user?.role === "influencer" && (
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg shadow-primary/20">Apply Now</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pitch to {campaign.brandName}</DialogTitle>
                <DialogDescription>
                  Explain why you're a great fit for the {campaign.title} campaign.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea 
                  placeholder="Hi there! I love your products and my audience engages heavily with skincare content..."
                  className="min-h-[150px]"
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                <Button onClick={handleApply} disabled={createApplication.isPending}>
                  {createApplication.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Pitch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Campaign Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{campaign.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.deliverables ? (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="whitespace-pre-wrap text-sm">{campaign.deliverables}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific deliverables outlined.</p>
              )}
            </CardContent>
          </Card>

          {user?.role === "brand" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-tight mt-8">Applicants ({campaign.applicationsCount})</h3>
              
              {appsLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : applications?.length ? (
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="shadow-sm border-muted overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage src={app.influencerAvatarUrl || ""} />
                                <AvatarFallback>{app.influencerName?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <Link href={`/influencers/${app.influencerId}`}>
                                  <h4 className="font-bold hover:text-primary transition-colors cursor-pointer">{app.influencerName}</h4>
                                </Link>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  {getAppStatusIcon(app.status)}
                                  <span className="capitalize font-medium">{app.status}</span>
                                  <span className="mx-1">•</span>
                                  <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {app.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                                >
                                  Decline
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-teal-600 hover:bg-teal-700 text-white"
                                  onClick={() => handleUpdateAppStatus(app.id, 'accepted')}
                                >
                                  Accept
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {app.message && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-foreground/90 italic border border-border/50">
                              "{app.message}"
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed shadow-none bg-muted/10">
                  <CardContent className="py-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No applications received yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-muted sticky top-24">
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-bold text-lg">${campaign.budget.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <p className="font-bold text-lg capitalize">{campaign.platform}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-bold text-lg">{new Date(campaign.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              {campaign.targetAudience && (
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Audience</p>
                    <p className="font-medium text-sm mt-1">{campaign.targetAudience}</p>
                  </div>
                </div>
              )}
              
              {campaign.timeline && (
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timeline</p>
                    <p className="font-medium text-sm mt-1">{campaign.timeline}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
