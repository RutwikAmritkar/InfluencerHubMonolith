import { useState, useEffect, useRef } from "react";
import { useListConversations, useListMessages, useSendMessage, getListMessagesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Send, Search, Info, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function Messages() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: convsLoading } = useListConversations();
  
  const { data: messages, isLoading: msgsLoading } = useListMessages(activeId as number, {
    query: {
      enabled: !!activeId,
      queryKey: getListMessagesQueryKey(activeId as number)
    }
  });

  const sendMessage = useSendMessage();

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeId) return;

    sendMessage.mutate(
      { data: { content: message }, id: activeId },
      {
        onSuccess: (newMsg) => {
          setMessage("");
          // Optimistically update
          queryClient.setQueryData(getListMessagesQueryKey(activeId), (old: any) => {
            return old ? [...old, newMsg] : [newMsg];
          });
        }
      }
    );
  };

  if (convsLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] border bg-card rounded-2xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r flex flex-col bg-muted/10 shrink-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9 h-10 bg-card border-none shadow-none" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations && conversations.length > 0 ? (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                    activeId === conv.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-background shrink-0 mt-0.5">
                    <AvatarImage src={conv.participantAvatarUrl || ""} />
                    <AvatarFallback>{conv.participantName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm truncate">{conv.participantName}</span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs truncate",
                      conv.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 mt-2">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No conversations found.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      {activeId ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat Header */}
          <div className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0">
            {conversations?.find(c => c.id === activeId) && (() => {
              const activeConv = conversations.find(c => c.id === activeId)!;
              return (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activeConv.participantAvatarUrl || ""} />
                    <AvatarFallback>{activeConv.participantName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-sm">{activeConv.participantName}</h3>
                    <div className="flex items-center text-xs text-teal-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5"></span>
                      Online
                    </div>
                  </div>
                </div>
              );
            })()}
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {msgsLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages?.length ? (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("flex max-w-[70%] gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                      {!isMe && (
                        <Avatar className="h-8 w-8 shrink-0 mt-auto">
                          <AvatarImage src={msg.senderAvatarUrl || ""} />
                          <AvatarFallback>{msg.senderName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div 
                          className={cn(
                            "p-3 text-sm",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm" 
                              : "bg-muted rounded-2xl rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className={cn("text-[10px] text-muted-foreground mt-1", isMe ? "text-right" : "text-left")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-50">
                <p>No messages yet. Send a message to start the conversation.</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-card border-t shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 relative">
              <Input 
                placeholder="Type a message..." 
                className="pr-12 h-12 bg-muted/50 border-none shadow-none rounded-full"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 bottom-1 h-10 w-10 rounded-full"
                disabled={!message.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-muted/5">
          <MessageSquare className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
