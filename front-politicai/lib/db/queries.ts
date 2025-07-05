import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  userLimit,
  type UserLimit,
  plans,
  type Plans,
  subscribePlanUsers,
  type SubscriblePlanUsers,
} from './schema';
import type { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

let db: ReturnType<typeof drizzle>;

function getDb() {
  if (!db) {
    // biome-ignore lint: Forbidden non-null assertion.
    const pool = mysql.createPool(process.env.MYSQL_URL!);
    db = drizzle(pool);
  }
  return db;
}

export async function saveUserLimit(
  userId: string,
  iterations: number,
  limitCount = 10,
) {
  try {
    await getDb().insert(userLimit).values({
      id: nanoid(),
      userId,
      iterations,
      limit: limitCount,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save user limit in database', error);
    throw error;
  }
}

export async function getLastInteraction(
  userId: string,
): Promise<UserLimit | null> {
  try {
    const result = await getDb()
      .select()
      .from(userLimit)
      .where(eq(userLimit.userId, userId))
      .orderBy(desc(userLimit.createdAt))
      .limit(1);

    if (result.length === 1) {
      return result[0];
    }

    return null;
  } catch (error) {
    console.error('Failed to get user limit from database');
    throw error;
  }
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await getDb().select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const data = await getDb().select().from(user).where(eq(user.id, id));
    return data[0];
  } catch (error) {
    console.error('Failed to get user by id from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await getDb().insert(user).values({ 
      id: nanoid(),
      email, 
      password: hash 
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await getDb().insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await getDb().delete(vote).where(eq(vote.chatId, id));
    await getDb().delete(message).where(eq(message.chatId, id));

    return await getDb().delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await getDb()
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await getDb().select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await getDb().insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await getDb()
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await getDb()
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await getDb()
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await getDb().insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await getDb().select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await getDb().insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await getDb()
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await getDb()
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await getDb()
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await getDb()
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await getDb().insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await getDb()
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await getDb().select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await getDb()
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await getDb()
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await getDb()
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await getDb().update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getPlans(): Promise<Array<Plans>> {
  try {
    return await getDb().select().from(plans);
  } catch (error) {
    console.error('Failed to get plans from database', error);
    throw error;
  }
}

export async function createSubscribePlan(planId: string, userId: string) {
  try {
    await getDb().insert(subscribePlanUsers).values({
      id: nanoid(),
      planId,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save user subscribePlanUsers', error);
    throw error;
  }
}

export async function getPendingPlanForUser(
  userId: string,
): Promise<SubscriblePlanUsers> {
  try {
    const data = await getDb()
      .select()
      .from(subscribePlanUsers)
      .where(
        and(
          eq(subscribePlanUsers.userId, userId),
          eq(subscribePlanUsers.pending, true),
        ),
      )
      .orderBy(desc(subscribePlanUsers.createdAt))
      .limit(1);

    return data[0];
  } catch (error) {
    console.error('Failed to get subscribed plans from database', error);
    throw error;
  }
}

export async function updateSubscribePlanToPayed(id: string) {
  try {
    await getDb()
      .update(subscribePlanUsers)
      .set({ pending: false, payedAt: new Date() })
      .where(eq(subscribePlanUsers.id, id));
  } catch (error) {
    console.error(
      'Failed to update subscribe plan to payed in database',
      error,
    );
    throw error;
  }
}
