import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable,
  messagesTable,
  user as userTable,
  dealsTable,
  dealActivityTable,
} from "@workspace/db";
import { CreateConversationBody, SendMessageBody } from "@workspace/api-zod";
import { eq, or, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const rows = await db
    .select()
    .from(conversationsTable)
    .where(or(eq(conversationsTable.user1Id, userId), eq(conversationsTable.user2Id, userId)));

  const conversations = await Promise.all(
    rows.map(async (conv) => {
      const participantId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const [participant] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(participantId)))
        .limit(1);

      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const unreadRows = await db
        .select()
        .from(messagesTable)
        .where(and(eq(messagesTable.conversationId, conv.id), eq(messagesTable.isRead, false)));
      const unreadCount = unreadRows.filter((m) => m.senderId !== userId).length;

      return {
        id: conv.id,
        participantId,
        participantName: participant?.name ?? "Unknown",
        participantAvatarUrl: participant?.image ?? null,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
        unreadCount,
      };
    })
  );

  res.json(conversations);
});

router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check if conversation already exists
  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(
          eq(conversationsTable.user1Id, userId),
          eq(conversationsTable.user2Id, parsed.data.participantId)
        ),
        and(
          eq(conversationsTable.user1Id, parsed.data.participantId),
          eq(conversationsTable.user2Id, userId)
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const participantId =
      existing[0].user1Id === userId ? existing[0].user2Id : existing[0].user1Id;
    const [participant] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, String(participantId)))
      .limit(1);
    res.status(201).json({
      id: existing[0].id,
      participantId,
      participantName: participant?.name ?? "Unknown",
      participantAvatarUrl: participant?.image ?? null,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
    });
    return;
  }

  const [conv] = await db
    .insert(conversationsTable)
    .values({ user1Id: userId, user2Id: parsed.data.participantId })
    .returning();

  const [participant] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, String(parsed.data.participantId)))
    .limit(1);

  res.status(201).json({
    id: conv.id,
    participantId: parsed.data.participantId,
    participantName: participant?.name ?? "Unknown",
    participantAvatarUrl: participant?.image ?? null,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
  });
});

router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const convId = parseInt(raw, 10);

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(messagesTable.createdAt);

  const formatted = await Promise.all(
    msgs.map(async (m) => {
      const [sender] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(m.senderId)))
        .limit(1);
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: sender?.name ?? null,
        senderAvatarUrl: sender?.image ?? null,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      };
    })
  );

  // Mark messages as read
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(eq(messagesTable.conversationId, convId));

  res.json(formatted);
});

router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const convId = parseInt(raw, 10);
  const userId = (req as typeof req & { userId: string | number }).userId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const senderIdInt = typeof userId === "number" ? userId : parseInt(String(userId), 10) || 1;

  // Check if conversation has any previous messages
  const existingMsgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .limit(2);
  const isFirstMessage = existingMsgs.length === 0;

  const [msg] = await db
    .insert(messagesTable)
    .values({ conversationId: convId, senderId: senderIdInt, content: parsed.data.content })
    .returning();

  // If first message in a deal conversation, log deal activity
  if (isFirstMessage) {
    const [deal] = await db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.conversationId, convId))
      .limit(1);
    if (deal) {
      await db.insert(dealActivityTable).values({
        dealId: deal.id,
        actorId: String(userId),
        actorParty: "user",
        action: "first_message_sent",
        description: "First message sent in Deal Room chat",
        metadata: { conversationId: convId, senderId: userId },
      });
    }
  }

  const [sender] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, String(userId)))
    .limit(1);

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: sender?.name ?? null,
    senderAvatarUrl: sender?.image ?? null,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
