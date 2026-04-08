-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "experienceLevel" TEXT,
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_job" ("company", "createdAt", "description", "id", "location", "postedAt", "source", "title", "updatedAt") SELECT "company", "createdAt", "description", "id", "location", "postedAt", "source", "title", "updatedAt" FROM "job";
DROP TABLE "job";
ALTER TABLE "new_job" RENAME TO "job";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
