import { sql } from "drizzle-orm";
import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    service: text("service").notNull(),
    barber: text("barber").notNull(),
    appointmentDate: text("appointment_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    notes: text("notes").notNull().default(""),
    cancelToken: text("cancel_token").unique(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    paymentMethod: text("payment_method").notNull().default("pix"),
    amountPaid: text("amount_paid").notNull().default("0"),
    status: text("status").notNull().default("confirmed"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("appointments_date_barber_idx").on(
      table.appointmentDate,
      table.barber,
    ),
  ],
);

export const scheduleBlocks = sqliteTable("schedule_blocks", {
  id: text("id").primaryKey(),
  barber: text("barber").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  reason: text("reason").notNull().default("Horário bloqueado"),
});

export const barberHours = sqliteTable(
  "barber_hours",
  {
    barber: text("barber").notNull(),
    weekday: text("weekday").notNull(),
    enabled: text("enabled").notNull().default("1"),
    startTime: text("start_time").notNull().default("08:00"),
    endTime: text("end_time").notNull().default("18:00"),
  },
  (table) => [primaryKey({ columns: [table.barber, table.weekday] })],
);

export const waitlist = sqliteTable("waitlist", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredPeriod: text("preferred_period")
    .notNull()
    .default("Qualquer horário"),
  service: text("service").notNull(),
  barber: text("barber").notNull(),
  status: text("status").notNull().default("waiting"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const adminUsers = sqliteTable("admin_users", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("barber"),
  active: text("active").notNull().default("1"),
});

export const businessSettings = sqliteTable("business_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey(),
  appointmentId: text("appointment_id"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  amount: text("amount").notNull(),
  method: text("method").notNull(),
  transactionDate: text("transaction_date").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: text("attempts").notNull().default("0"),
  blockedUntil: text("blocked_until"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull().default(""),
  details: text("details").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const supportTrash = sqliteTable("support_trash", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: text("payload").notNull(),
  deletedBy: text("deleted_by").notNull(),
  deletedAt: text("deleted_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  restoredAt: text("restored_at"),
});

export const errorLogs = sqliteTable("error_logs", {
  id: text("id").primaryKey(),
  route: text("route").notNull(),
  message: text("message").notNull(),
  context: text("context").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
});

export const appointmentSlots = sqliteTable(
  "appointment_slots",
  {
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    barber: text("barber").notNull(),
    appointmentDate: text("appointment_date").notNull(),
    slotTime: text("slot_time").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.barber, table.appointmentDate, table.slotTime],
    }),
    index("appointment_slots_appointment_idx").on(table.appointmentId),
  ],
);
