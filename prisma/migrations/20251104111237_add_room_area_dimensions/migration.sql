-- Add area dimensions to Room model for rectangular selection on floor plans
ALTER TABLE "Room" ADD COLUMN "areaWidth" DOUBLE PRECISION;
ALTER TABLE "Room" ADD COLUMN "areaHeight" DOUBLE PRECISION;

