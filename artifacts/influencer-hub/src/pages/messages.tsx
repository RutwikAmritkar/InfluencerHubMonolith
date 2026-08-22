import { useState, useEffect, useRef } from "react";
import { useListConversations, useListMessages, useSendMessage, getListMessagesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { 
  Loader2, 
  Send, 
  Search, 
  Info, 
  MessageSquare, 
  ArrowLeft, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Briefcase, 
  ExternalLink,
  CheckCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { toast } from "sonner";

// Realistic Fallback Conversations Test Data Roster
const DEFAULT_CONVERSATIONS = [
  {
    id: 1,
    participantId: 101,
    participantName: "Glow Cosmetics",
    participantAvatarUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    lastMessage: "Hey! We loved your pitch for the Summer Skincare launch. Are you available for a 3-week campaign?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    unreadCount: 2,
    campaignTitle: "Summer Skincare Launch",
    campaignType: "Instagram Reel",
    campaignBudget: "$4,500",
    campaignStatus: "Active",
    campaignId: "1",
  },
  {
    id: 2,
    participantId: 102,
    participantName: "NovaTech Gear",
    participantAvatarUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    lastMessage: "Thanks for submitting the draft video! Our brand team approved the 60s Reel draft.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unreadCount: 0,
    campaignTitle: "Tech Review 2026",
    campaignType: "YouTube Unboxing",
    campaignBudget: "$12,500",
    campaignStatus: "Active",
    campaignId: "2",
  },
  {
    id: 3,
    participantId: 103,
    participantName: "UrbanFit Apparel",
    participantAvatarUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150&auto=format&fit=crop",
    lastMessage: "The contract details have been updated with the $4,500 budget increase.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
    campaignTitle: "Fall Fitness Drop",
    campaignType: "TikTok & Stories",
    campaignBudget: "$8,000",
    campaignStatus: "Active",
    campaignId: "3",
  },
  {
    id: 4,
    participantId: 104,
    participantName: "FreshBite Organics",
    participantAvatarUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=150&auto=format&fit=crop",
    lastMessage: "We shipped the sample product package to your address. Track ID #89201.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unreadCount: 0,
    campaignTitle: "Organic Snack Rollout",
    campaignType: "Instagram Feed",
    campaignBudget: "$3,200",
    campaignStatus: "Active",
    campaignId: "4",
  },
];

// Fallback Test Messages per Conversation
const DEFAULT_MESSAGES_MAP: Record<number, any[]> = {
  1: [
    {
      id: 1001,
      conversationId: 1,
      senderId: 101,
      senderName: "Glow Cosmetics",
      senderAvatarUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
      content: "Hi Alex! We came across your creator profile and loved your aesthetic & engagement rate.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 1002,
      conversationId: 1,
      senderId: 999,
      senderName: "Creator",
      senderAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      content: "Thanks so much! I'm a huge fan of your clean skincare line.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: 1003,
      conversationId: 1,
      senderId: 101,
      senderName: "Glow Cosmetics",
      senderAvatarUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
      content: "Hey! We loved your pitch for the Summer Skincare launch. Are you available for a 3-week campaign?",
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
  ],
  2: [
    {
      id: 2001,
      conversationId: 2,
      senderId: 102,
      senderName: "NovaTech Gear",
      senderAvatarUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
      content: "Hello! Did you get a chance to review the tech review deliverables?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 2002,
      conversationId: 2,
      senderId: 999,
      senderName: "Creator",
      senderAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      content: "Yes, I just uploaded the draft video link in the portal!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 2003,
      conversationId: 2,
      senderId: 102,
      senderName: "NovaTech Gear",
      senderAvatarUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
      content: "Thanks for submitting the draft video! Our brand team approved the 60s Reel draft.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ],
  3: [
    {
      id: 3001,
      conversationId: 3,
      senderId: 103,
      senderName: "UrbanFit Apparel",
      senderAvatarUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=150&auto=format&fit=crop",
      content: "The contract details have been updated with the $4,500 budget increase.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  4: [
    {
      id: 4001,
      conversationId: 4,
      senderId: 104,
      senderName: "FreshBite Organics",
      senderAvatarUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=150&auto=format&fit=crop",
      content: "We shipped the sample product package to your address. Track ID #89201.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
};

export default function Messages() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<number, any[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: apiConvs, isLoading: convsLoading } = useListConversations();
  
  const { data: apiMsgs, isLoading: msgsLoading } = useListMessages(activeId as number, {
    query: {
      enabled: !!activeId,
      queryKey: getListMessagesQueryKey(activeId as number)
    }
  });

  const sendMessage = useSendMessage();

  const rawConversations = Array.isArray(apiConvs) && apiConvs.length > 0 ? apiConvs : DEFAULT_CONVERSATIONS;

  const conversations = rawConversations.filter((c: any) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (conversations && conversations.length > 0 && activeId === null) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const activeMessages = (Array.isArray(apiMsgs) && apiMsgs.length > 0)
    ? apiMsgs
    : (activeId ? (localMessages[activeId] || DEFAULT_MESSAGES_MAP[activeId] || []) : []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSelectConv = (id: number) => {
    setActiveId(id);
    setShowMobileChat(true);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeId) return;

    const newMsg = {
      id: Date.now(),
      conversationId: activeId,
      senderId: user?.id || 999,
      senderName: user?.name || "Creator",
      senderAvatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => {
      const current = prev[activeId] || DEFAULT_MESSAGES_MAP[activeId] || [];
      return { ...prev, [activeId]: [...current, newMsg] };
    });

    setMessage("");

    sendMessage.mutate(
      { data: { content: message }, id: activeId },
      {
        onSuccess: (resMsg) => {
          queryClient.setQueryData(getListMessagesQueryKey(activeId), (old: any) => {
            return old ? [...old, resMsg] : [resMsg];
          });
        },
        onError: () => {
          // Demo fallback keeps locally posted message intact
        }
      }
    );
  };

  if (convsLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
      </div>
    );
  }

  const activeConv: any = rawConversations.find((c: any) => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-140px)] border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] rounded-2xl shadow-xs overflow-hidden text-slate-900 dark:text-slate-100">
      
      {/* ─── 1. CONVERSATION LIST PANEL ────────────────────────────────────────── */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-[#E2E8F3] dark:border-slate-800/80 flex flex-col bg-[#F8FAFD] dark:bg-slate-900/40 shrink-0",
          showMobileChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* Header Search Input */}
        <div className="p-3.5 border-b border-[#E2E8F3] dark:border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-slate-800/80 border-[#E2E8F3] dark:border-slate-700 text-xs rounded-xl text-[#0F172A] dark:text-slate-100"
            />
          </div>
        </div>

        {/* Roster Stream */}
        <ScrollArea className="flex-1">
          {conversations && conversations.length > 0 ? (
            <div className="p-2 space-y-1">
              {conversations.map((conv: any) => {
                const isActive = activeId === conv.id;
                const isUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group relative",
                      isActive
                        ? "bg-[#F1F5FF] dark:bg-[#18233A] border-l-4 border-l-[#315CF5] text-[#0F172A] dark:text-slate-100 font-semibold shadow-2xs"
                        : "hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                        <AvatarImage src={conv.participantAvatarUrl || ""} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-extrabold text-xs">
                          {conv.participantName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Active Status Dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#11172A]" />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {conv.participantName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        isUnread ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="h-2.5 w-2.5 bg-[#315BEF] rounded-full shrink-0 mt-2 shadow-2xs" title="Unread message" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-xs font-medium">No conversations found.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── 2. ACTIVE CONVERSATION VIEWPORT ─────────────────────────────────── */}
      {activeId && activeConv ? (
        <div
          className={cn(
            "flex-1 flex flex-col bg-white dark:bg-[#11172A]",
            showMobileChat ? "flex" : "hidden md:flex"
          )}
        >
          {/* Header Bar */}
          <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#11172A] shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-slate-600 dark:text-slate-300 rounded-full"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={activeConv.participantAvatarUrl || ""} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-bold text-xs">
                    {activeConv.participantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{activeConv.participantName}</h3>
                    <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>
                      Active
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Active campaign · {activeConv.campaignTitle || "Brand Partnership"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/campaigns/${activeConv.campaignId || 1}`}>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold border-slate-200 dark:border-slate-700 text-[#315BEF] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl cursor-pointer hidden sm:flex items-center gap-1">
                  <span>View Campaign</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Compact Campaign Context Banner */}
          <div className="bg-slate-50/80 dark:bg-[#18233A]/70 border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <Briefcase className="w-3.5 h-3.5 text-[#315BEF] dark:text-blue-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{activeConv.campaignTitle || "Summer Skincare Launch"}</span>
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px] hidden sm:inline">{activeConv.campaignType || "Instagram Reel"} · {activeConv.campaignBudget || "$4,500"}</span>
              <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 text-[9px] font-bold px-1.5 py-0 shrink-0">
                Active
              </Badge>
            </div>
            <Link href={`/campaigns/${activeConv.campaignId || 1}`} className="text-[#315BEF] dark:text-blue-400 font-bold hover:underline text-[11px] shrink-0 ml-2">
              Brief →
            </Link>
          </div>

          {/* Messages Stream */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white dark:bg-[#11172A]"
          >
            {msgsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#315BEF]" />
              </div>
            ) : activeMessages.length ? (
              activeMessages.map((msg) => {
                const isMe = msg.senderId === (user?.id || 999);
                return (
                  <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("flex max-w-[85%] sm:max-w-[70%] gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}>
                      {!isMe && (
                        <Avatar className="h-8 w-8 shrink-0 mt-auto border border-slate-200 dark:border-slate-700">
                          <AvatarImage src={msg.senderAvatarUrl || ""} />
                          <AvatarFallback className="text-[10px] font-bold">{msg.senderName?.charAt(0) || "B"}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div 
                          className={cn(
                            "p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs",
                            isMe 
                              ? "bg-[#315BEF] text-white rounded-2xl rounded-tr-xs" 
                              : "bg-slate-100 dark:bg-[#18233A] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-xs border border-slate-200/80 dark:border-slate-700/60"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className={cn("text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono flex items-center gap-1", isMe ? "justify-end" : "justify-start")}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60">
                <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No messages yet. Start the conversation with {activeConv.participantName}.</p>
              </div>
            )}
          </div>

          {/* Professional Message Composer */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#11172A] border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form onSubmit={handleSend} className="w-full">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#18233A] border border-slate-200/80 dark:border-slate-700/70 p-3 space-y-2 focus-within:border-[#315BEF] focus-within:ring-2 focus-within:ring-[#315BEF]/10 transition-all">
                <textarea
                  placeholder={`Message ${activeConv.participantName}...`}
                  rows={2}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none resize-none border-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toast.info("Attachment placeholder — ready for upload.")}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                      title="Attach file"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Attach</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info("Emoji picker placeholder.")}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      title="Add emoji"
                    >
                      <Smile className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    size="sm"
                    className="h-8 px-4 rounded-xl bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
                    disabled={!message.trim()}
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/40 dark:bg-slate-900/20">
          <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
