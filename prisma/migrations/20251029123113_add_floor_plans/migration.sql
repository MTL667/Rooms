-- CreateTable
CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "imageUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN "floorPlanId" TEXT,
ADD COLUMN "positionX" DOUBLE PRECISION,
ADD COLUMN "positionY" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

