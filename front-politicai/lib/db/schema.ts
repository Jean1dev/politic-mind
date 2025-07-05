import type { InferSelectModel } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  text,
  primaryKey,
  foreignKey,
  boolean,
  int,
} from 'drizzle-orm/mysql-core';

export const user = mysqlTable('User', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = mysqlTable('Chat', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: varchar('userId', { length: 36 })
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { length: 10, enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = mysqlTable('Message', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  chatId: varchar('chatId', { length: 36 })
    .notNull()
    .references(() => chat.id),
  role: varchar('role', { length: 20 }).notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = mysqlTable(
  'Vote',
  {
    chatId: varchar('chatId', { length: 36 })
      .notNull()
      .references(() => chat.id),
    messageId: varchar('messageId', { length: 36 })
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table: any) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = mysqlTable(
  'Document',
  {
    id: varchar('id', { length: 36 }).notNull(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { length: 10, enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: varchar('userId', { length: 36 })
      .notNull()
      .references(() => user.id),
  },
  (table: any) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = mysqlTable(
  'Suggestion',
  {
    id: varchar('id', { length: 36 }).notNull(),
    documentId: varchar('documentId', { length: 36 }).notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: varchar('userId', { length: 36 })
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const userLimit = mysqlTable(
  'UserLimit',
  {
    id: varchar('id', { length: 36 }).notNull(),
    iterations: int('iterations').notNull().default(0),
    limit: int('limit').notNull().default(10),
    isUnlimited: boolean('isUnlimited').notNull().default(false),
    userId: varchar('userId', { length: 36 })
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.id] }),
  }),
);

export type UserLimit = InferSelectModel<typeof userLimit>;

export const plans = mysqlTable(
  'Plans',
  {
    id: varchar('id', { length: 36 }).notNull(),
    planRef: text('planRef').notNull(),
    active: boolean('active').notNull().default(true),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: int('price').notNull(),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.id] }),
  }),
);

export type Plans = InferSelectModel<typeof plans>;

export const subscribePlanUsers = mysqlTable(
  'SubscriblePlanUsers',
  {
    id: varchar('id', { length: 36 }).notNull(),
    pending: boolean('pending').notNull().default(true),
    planId: varchar('planId', { length: 36 })
      .notNull()
      .references(() => plans.id),
    userId: varchar('userId', { length: 36 })
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
    payedAt: timestamp('payedAt'),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.id] }),
    planRef: foreignKey({
      columns: [table.planId],
      foreignColumns: [plans.id],
    }),
  }),
);

export type SubscriblePlanUsers = InferSelectModel<typeof subscribePlanUsers>;
