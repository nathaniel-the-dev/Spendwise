import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["email", "google"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["expense", "income"]);
export const billingCycleEnum = pgEnum("billing_cycle", ["weekly", "monthly", "quarterly", "yearly", "custom"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "paused", "cancelled"]);
export const budgetPeriodEnum = pgEnum("budget_period", ["weekly", "monthly", "yearly"]);
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const localeEnum = pgEnum("locale", ["en", "es"]);

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  hashedPassword: text("hashedPassword"),

  preferredCurrency: varchar("preferred_currency", { length: 3 }).default("USD").notNull(),
  locale: localeEnum("locale").default("en").notNull(),
  theme: themeEnum("theme").default("system").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: uniqueIndex("account_provider_provider_account_id").on(
      account.provider,
      account.providerAccountId
    ),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: uniqueIndex("vt_identifier_token").on(vt.identifier, vt.token),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compoundKey: uniqueIndex("authenticator_provider_provider_account_id").on(
      authenticator.providerAccountId,
      authenticator.credentialID
    ),
  })
);

export const categories = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("circle"),
  color: text("color").notNull().default("#6b7280"),
  type: transactionTypeEnum("type").notNull().default("expense"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transaction", {
  id: text("id").primaryKey(),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  amountInPreferred: real("amount_in_preferred"),
  description: text("description").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  type: transactionTypeEnum("type").notNull().default("expense"),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgets = pgTable("budget", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  period: budgetPeriodEnum("period").notNull().default("monthly"),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  provider: text("provider"),
  description: text("description"),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  amountInPreferred: real("amount_in_preferred"),
  billingCycle: billingCycleEnum("billing_cycle").notNull().default("monthly"),
  billingInterval: integer("billing_interval").default(1),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  nextBillingDate: timestamp("next_billing_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  logo: text("logo"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionPayments = pgTable("subscription_payment", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  paidDate: timestamp("paid_date", { mode: "date" }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
