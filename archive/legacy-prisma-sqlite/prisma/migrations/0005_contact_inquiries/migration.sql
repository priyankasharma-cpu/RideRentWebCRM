CREATE TABLE "contact_inquiries" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "submission_key" TEXT NOT NULL UNIQUE,
 "name" TEXT NOT NULL,
 "email" TEXT NOT NULL,
 "phone" TEXT NOT NULL DEFAULT '',
 "inquiry_type" TEXT NOT NULL,
 "message" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'new' CHECK ("status" IN ('new','read')),
 "created_at" TEXT NOT NULL,
 "updated_at" TEXT NOT NULL
);
CREATE INDEX "contact_inquiries_status_created" ON "contact_inquiries"("status","created_at");
CREATE INDEX "contact_inquiries_created" ON "contact_inquiries"("created_at");
