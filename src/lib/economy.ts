import { Prisma } from '@prisma/client';
import { prisma } from './db';

// Approve a submission and award points: bump the author's balance + lifetime
// earned and record a ledger entry, all in one transaction.
export async function approveSubmission(submissionId: string, points: number, adminId: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    throw new Error('Submission not found');
  }

  const award = Number.isFinite(points) && points > 0 ? Math.floor(points) : 0;
  const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });

  await prisma.$transaction(async (tx) => {
    // Reverse any previously awarded points before re-applying.
    if (submission.status === 'Approved' && submission.pointsAwarded > 0 && author) {
      await tx.user.update({
        where: { id: author.id },
        data: {
          balance: { decrement: submission.pointsAwarded },
          totalEarned: { decrement: submission.pointsAwarded },
        },
      });
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status: 'Approved',
        pointsAwarded: award,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });

    if (author && award > 0) {
      await tx.user.update({
        where: { id: author.id },
        data: { balance: { increment: award }, totalEarned: { increment: award } },
      });
      await tx.ledgerEntry.create({
        data: { userId: author.id, delta: award, reason: `Submission approved: ${submission.title}` },
      });
    }
  });
}

// Reject a submission. If it had been approved, claw back the points.
export async function rejectSubmission(submissionId: string, adminId: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    throw new Error('Submission not found');
  }

  const author = await prisma.user.findUnique({ where: { hackClubId: submission.hackClubId } });

  await prisma.$transaction(async (tx) => {
    if (submission.status === 'Approved' && submission.pointsAwarded > 0 && author) {
      await tx.user.update({
        where: { id: author.id },
        data: {
          balance: { decrement: submission.pointsAwarded },
          totalEarned: { decrement: submission.pointsAwarded },
        },
      });
      await tx.ledgerEntry.create({
        data: { userId: author.id, delta: -submission.pointsAwarded, reason: `Submission reverted: ${submission.title}` },
      });
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: { status: 'Rejected', pointsAwarded: 0, reviewedAt: new Date(), reviewedById: adminId },
    });
  });
}

// Manual admin balance adjustment (positive or negative).
export async function adjustBalance(userId: string, delta: number, reason: string) {
  const amount = Math.trunc(delta);
  if (!Number.isFinite(amount) || amount === 0) {
    return;
  }

  const data: Prisma.UserUpdateInput = { balance: { increment: amount } };
  if (amount > 0) {
    data.totalEarned = { increment: amount };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data });
    await tx.ledgerEntry.create({
      data: { userId, delta: amount, reason: reason || 'Admin adjustment' },
    });
  });
}

// Member redeems a shop item: validate stock + balance, spend points, create order.
//
// The balance and stock deductions use conditional UPDATE statements (via
// Prisma's updateMany with a where filter) so that concurrent requests cannot
// race past the checks.  Each translates to a single atomic SQL UPDATE … WHERE
// that PostgreSQL executes with row-level locking — eliminating the double-spend
// and oversell race conditions that a read-then-write pattern would allow.
export async function redeemItem(userId: string, itemId: string) {
  await prisma.$transaction(async (tx) => {
    // Read the item first for early, user-friendly error messages and to get the
    // cost/name values needed for the ledger entry and order record.
    const item = await tx.shopItem.findUnique({ where: { id: itemId } });
    if (!item || !item.active) {
      throw new Error('This item is not available.');
    }
    if (item.stock !== null && item.stock <= 0) {
      throw new Error('This item is out of stock.');
    }

    // Atomically deduct the balance. The WHERE balance >= cost guard prevents
    // overdraft even under concurrent requests — this is a single UPDATE … WHERE
    // statement that Postgres executes with row-level locking.
    const deducted = await tx.user.updateMany({
      where: { id: userId, balance: { gte: item.cost } },
      data: { balance: { decrement: item.cost } },
    });
    if (deducted.count === 0) {
      // 0 rows updated: either the user does not exist or has insufficient balance.
      const exists = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!exists) throw new Error('User not found.');
      throw new Error('You do not have enough points for this item.');
    }

    await tx.ledgerEntry.create({ data: { userId, delta: -item.cost, reason: `Shop: ${item.name}` } });

    // Atomically decrement stock. If another request claimed the last unit
    // between our initial read and this write, the UPDATE returns 0 rows and we
    // throw — the transaction rolls back, restoring the balance deducted above.
    if (item.stock !== null) {
      const stocked = await tx.shopItem.updateMany({
        where: { id: itemId, active: true, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (stocked.count === 0) {
        throw new Error('This item just sold out. Your points have not been charged.');
      }
    }

    await tx.shopOrder.create({
      data: { userId, shopItemId: item.id, itemName: item.name, cost: item.cost, status: 'pending' },
    });
  });
}

export async function fulfillOrder(orderId: string, note: string) {
  await prisma.shopOrder.update({
    where: { id: orderId },
    data: { status: 'fulfilled', fulfillmentNote: note ? note : null },
  });
}

// Reject/refund an order: return points and restock, once.
export async function refundOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.shopOrder.findUnique({ where: { id: orderId } });
    if (!order || order.status === 'rejected') {
      return;
    }

    await tx.user.update({ where: { id: order.userId }, data: { balance: { increment: order.cost } } });
    await tx.ledgerEntry.create({
      data: { userId: order.userId, delta: order.cost, reason: `Refund: ${order.itemName}` },
    });

    if (order.shopItemId) {
      const item = await tx.shopItem.findUnique({ where: { id: order.shopItemId } });
      if (item && item.stock !== null) {
        await tx.shopItem.update({ where: { id: order.shopItemId }, data: { stock: { increment: 1 } } });
      }
    }

    await tx.shopOrder.update({ where: { id: orderId }, data: { status: 'rejected' } });
  });
}
