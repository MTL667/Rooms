-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationTenant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "LocationTenant_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "LocationTenant_tenantId_idx" ON "LocationTenant"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LocationTenant_locationId_tenantId_key" ON "LocationTenant"("locationId", "tenantId");

-- AddForeignKey
ALTER TABLE "LocationTenant" ADD CONSTRAINT "LocationTenant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

