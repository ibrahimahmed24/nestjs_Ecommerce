/*
  Warnings:

  - You are about to drop the column `caertId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `chackedout` on the `carts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,cartId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cartId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cartId` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_caertId_fkey";

-- DropIndex
DROP INDEX "cart_items_caertId_idx";

-- DropIndex
DROP INDEX "cart_items_productId_caertId_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "caertId",
ADD COLUMN     "cartId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "carts" DROP COLUMN "chackedout",
ADD COLUMN     "checkedOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_productId_cartId_key" ON "cart_items"("productId", "cartId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_cartId_key" ON "orders"("cartId");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
