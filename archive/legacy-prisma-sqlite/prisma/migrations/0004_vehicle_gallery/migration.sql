CREATE TABLE "vehicle_images" (
  "vehicle_id" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  PRIMARY KEY ("vehicle_id", "id"),
  FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vehicle_images_position_range" CHECK ("position" >= 0 AND "position" < 5)
);
CREATE UNIQUE INDEX "vehicle_images_position" ON "vehicle_images"("vehicle_id", "position");
CREATE UNIQUE INDEX "vehicle_images_url" ON "vehicle_images"("vehicle_id", "url");
