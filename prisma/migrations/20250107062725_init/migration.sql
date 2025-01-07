-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userid" TEXT NOT NULL,
    "endpoint" TEXT,
    "token" TEXT,
    "langflowId" TEXT,
    "flowId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_userid_key" ON "Config"("userid");
