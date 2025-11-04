-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "AllowedTenant" ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'PENDING';

-- Update existing tenants to APPROVED so they continue working
UPDATE "AllowedTenant" SET "status" = 'APPROVED';

