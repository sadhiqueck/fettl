-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GroupCategory" AS ENUM ('TRIP', 'HOME', 'OFFICE', 'ROOMMATES', 'FRIENDS', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SplitMethod" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'ITEMIZED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRANSPORT', 'ACCOMMODATION', 'SHOPPING', 'ENTERTAINMENT', 'UTILITIES', 'RENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'SETTLEMENT_CREATED', 'SETTLEMENT_CONFIRMED', 'SETTLEMENT_REJECTED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'GROUP_UPDATED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXPENSE_ADDED', 'SETTLEMENT_RECEIVED', 'SETTLEMENT_REQUESTED', 'GROUP_INVITE', 'REMINDER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "vpa" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "GroupCategory" NOT NULL DEFAULT 'OTHER',
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "coverImage" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "nickname" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidById" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "splitMethod" "SplitMethod" NOT NULL DEFAULT 'EQUAL',
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "receiptUrl" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_splits" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "percentage" INTEGER,
    "shares" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_member_balances" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "group_member_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "expenseId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwordless_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT,
    "tokenHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passwordless_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_inviteCode_key" ON "groups"("inviteCode");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_userId_groupId_key" ON "group_members"("userId", "groupId");

-- CreateIndex
CREATE INDEX "expenses_groupId_idx" ON "expenses"("groupId");

-- CreateIndex
CREATE INDEX "expenses_paidById_idx" ON "expenses"("paidById");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_groupId_isDeleted_idx" ON "expenses"("groupId", "isDeleted");

-- CreateIndex
CREATE INDEX "expense_splits_userId_idx" ON "expense_splits"("userId");

-- CreateIndex
CREATE INDEX "expense_splits_expenseId_idx" ON "expense_splits"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_splits_expenseId_userId_key" ON "expense_splits"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "group_member_balances_groupId_idx" ON "group_member_balances"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_balances_groupId_userId_key" ON "group_member_balances"("groupId", "userId");

-- CreateIndex
CREATE INDEX "settlements_groupId_idx" ON "settlements"("groupId");

-- CreateIndex
CREATE INDEX "settlements_payerId_idx" ON "settlements"("payerId");

-- CreateIndex
CREATE INDEX "settlements_receiverId_idx" ON "settlements"("receiverId");

-- CreateIndex
CREATE INDEX "activity_logs_groupId_idx" ON "activity_logs"("groupId");

-- CreateIndex
CREATE INDEX "activity_logs_groupId_createdAt_idx" ON "activity_logs"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_groupId_createdAt_idx" ON "chat_messages"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "passwordless_requests_email_idx" ON "passwordless_requests"("email");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member_balances" ADD CONSTRAINT "group_member_balances_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member_balances" ADD CONSTRAINT "group_member_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
