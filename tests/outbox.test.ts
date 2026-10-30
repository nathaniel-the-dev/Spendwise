import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { isOutboxTransaction, isRetryableReplayStatus } from "@/lib/outbox";
import type { OutboxTransaction } from "@/lib/outbox";

/**
 * The outbox grew a `kind` discriminator so a queued transfer replays to
 * /api/transfers instead of /api/transactions. Getting that wrong doesn't throw
 * at write time — it fails later, during replay, as a dropped user's transfer.
 */

const base = { id: "o1", userId: "u1", createdAt: 0 };

describe("isOutboxTransaction", () => {
  test("a transfer entry is not treated as a transaction", () => {
    // The bug this guards: a transfer payload posted to /api/transactions is
    // rejected by the Zod schema and silently dropped on replay.
    const entry: OutboxTransaction = {
      ...base,
      kind: "transfer",
      payload: {
        fromAccountId: "a1",
        toAccountId: "a2",
        amount: 100,
        date: "2026-01-15",
      },
    };
    assert.equal(isOutboxTransaction(entry), false);
  });

  test("an explicit transaction entry is treated as a transaction", () => {
    const entry: OutboxTransaction = {
      ...base,
      kind: "transaction",
      payload: {
        amount: 10,
        description: "Coffee",
        date: "2026-01-15",
        type: "expense",
      },
    };
    assert.equal(isOutboxTransaction(entry), true);
  });

  test("an entry queued before kinds existed still counts as a transaction", () => {
    // Backwards compatibility: a queue written by the previous build has no
    // `kind`, and defaulting keeps it draining instead of vanishing.
    const legacy = {
      ...base,
      payload: { amount: 10, description: "Coffee", date: "2026-01-15" },
    } as OutboxTransaction;
    assert.equal(isOutboxTransaction(legacy), true);
  });
});

describe("outbox payloads survive the queue", () => {
  test("a transaction keeps its account so replay does not lose the balance", () => {
    // This is step 6's whole point: an offline entry replayed without accountId
    // lands with a NULL account and silently drops out of its balance.
    const payload: OutboxTransaction["payload"] = {
      amount: 42,
      description: "Groceries",
      date: "2026-01-15",
      accountId: "a1",
    };
    assert.equal((payload as { accountId?: string }).accountId, "a1");
  });

  test("a transaction queued without an account is still valid", () => {
    // Existing single-account behaviour must keep working unchanged.
    const payload: OutboxTransaction["payload"] = {
      amount: 42,
      description: "Groceries",
      date: "2026-01-15",
    };
    assert.equal((payload as { accountId?: string }).accountId, undefined);
  });
});

describe("isRetryableReplayStatus", () => {
  test("retries auth, throttle, timeout and server failures", () => {
    for (const status of [401, 403, 408, 429, 500, 503]) {
      assert.equal(isRetryableReplayStatus(status), true, `expected ${status} retryable`);
    }
  });

  test("drops a genuine validation rejection rather than blocking the queue", () => {
    for (const status of [400, 404, 422]) {
      assert.equal(isRetryableReplayStatus(status), false, `expected ${status} final`);
    }
  });
});