-- CreateEnum
CREATE TYPE "Role" AS ENUM ('pmm', 'smm', 'vmm');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('completed', 'pending');

-- CreateEnum
CREATE TYPE "DonorStatus" AS ENUM ('Pending', 'Approved', 'Excluded', 'AutoExcluded');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Planning', 'ListGeneration', 'Review', 'Ready', 'Complete');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'pmm',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_donor_lists" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "totalDonors" INTEGER NOT NULL DEFAULT 0,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "excluded" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "autoExcluded" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "generatedBy" INTEGER NOT NULL,

    CONSTRAINT "event_donor_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_donors" (
    "id" SERIAL NOT NULL,
    "donorListId" INTEGER NOT NULL,
    "donorId" INTEGER NOT NULL,
    "status" "DonorStatus" NOT NULL DEFAULT 'Pending',
    "excludeReason" TEXT,
    "reviewerId" INTEGER,
    "reviewDate" TIMESTAMP(3),
    "comments" TEXT,
    "autoExcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donors" (
    "id" SERIAL NOT NULL,
    "pmm" TEXT,
    "smm" TEXT,
    "vmm" TEXT,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "nickName" TEXT,
    "lastName" TEXT,
    "organizationName" TEXT,
    "totalDonations" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPledges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "largestGift" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "largestGiftAppeal" TEXT,
    "firstGiftDate" TIMESTAMP(3),
    "lastGiftDate" TIMESTAMP(3),
    "lastGiftAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastGiftRequest" TEXT,
    "lastGiftAppeal" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "contactPhoneType" TEXT,
    "phoneRestrictions" TEXT,
    "emailRestrictions" TEXT,
    "communicationRestrictions" TEXT,
    "subscriptionEventsInPerson" TEXT,
    "subscriptionEventsMagazine" TEXT,
    "communicationPreference" TEXT,
    "tags" TEXT,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "focus" TEXT,
    "criteriaMinGivingLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timelineListGenerationDate" TIMESTAMP(3),
    "timelineReviewDeadline" TIMESTAMP(3),
    "timelineInvitationDate" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'Planning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "event_donors_donorListId_idx" ON "event_donors"("donorListId");

-- CreateIndex
CREATE INDEX "event_donors_donorId_idx" ON "event_donors"("donorId");

-- CreateIndex
CREATE INDEX "event_donors_reviewerId_idx" ON "event_donors"("reviewerId");

-- AddForeignKey
ALTER TABLE "event_donor_lists" ADD CONSTRAINT "event_donor_lists_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_donor_lists" ADD CONSTRAINT "event_donor_lists_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_donors" ADD CONSTRAINT "event_donors_donorListId_fkey" FOREIGN KEY ("donorListId") REFERENCES "event_donor_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_donors" ADD CONSTRAINT "event_donors_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_donors" ADD CONSTRAINT "event_donors_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
