import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  ACCOUNT_TYPES,
  accountBalance,
  transferValue,
  netWorth,
  isMissingAccountTableError,
} from "@/lib/accounts";

/**
 * The balance formula is P0 money math (docs/accounts.md) and is also encoded a
 * second time in the `account_balance` SQL view. These tests pin the JS side of
 * that contract so the two can't drift silently.
 */

const ACCOUNT = { id: "a1", openingBalance: 0 };

describe("transferValue", () => {
  test("uses the frozen preferred-currency snapshot when present", () => {
    // 9.99 USD at 158 JMD — the snapshot is what totals correctly.
    assert.equal(transferValue({ amount: 9.99, amountInPreferred: 1578.42 }), 1578.42);
  });

  test("falls back to amount when there is no snapshot", () => {
    assert.equal(transferValue({ amount: 250 }), 250);
  });

  test("treats a null snapshot as absent rather than as zero", () => {
    // A zero here would silently wipe a foreign row out of every total.
    assert.equal(transferValue({ amount: 9.99, amountInPreferred: null }), 9.99);
  });

  test("honours a zero snapshot instead of falling back to the face amount", () => {
    // The one input where `??` and `||` disagree: a row converted to exactly
    // zero in the preferred currency (a fully-discounted or rounded-to-nothing
    // charge) must total as zero, not as its foreign face amount.
    assert.equal(transferValue({ amount: 20, amountInPreferred: 0 }), 0);
  });

  test("always returns a positive value", () => {
    assert.equal(transferValue({ amount: -50 }), 50);
    assert.equal(transferValue({ amount: 50, amountInPreferred: -50 }), 50);
  });
});

describe("accountBalance", () => {
  test("is zero for an empty account", () => {
    assert.equal(accountBalance(ACCOUNT, [], []), 0);
  });

  test("starts from the opening balance", () => {
    assert.equal(accountBalance({ id: "a1", openingBalance: 1000 }, [], []), 1000);
  });

  test("adds income and subtracts expenses", () => {
    const txns = [
      { type: "income", accountId: "a1", amount: 2000 },
      { type: "expense", accountId: "a1", amount: 500 },
      { type: "expense", accountId: "a1", amount: 120.5 },
    ];
    assert.equal(accountBalance(ACCOUNT, txns, []), 2000 - 500 - 120.5);
  });

  test("ignores transactions belonging to another account", () => {
    const txns = [
      { type: "expense", accountId: "a2", amount: 999 },
      { type: "income", accountId: "a1", amount: 100 },
    ];
    assert.equal(accountBalance(ACCOUNT, txns, []), 100);
  });

  test("ignores transactions with no account (pre-accounts rows)", () => {
    const txns = [
      { type: "expense", accountId: null, amount: 40 },
      { type: "expense", accountId: "a1", amount: 10 },
    ];
    assert.equal(accountBalance(ACCOUNT, txns, []), -10);
  });

  test("totals a foreign-currency row by its snapshot, not its face amount", () => {
    // 5.55 USD must not be counted as 5.55 JMD.
    const txns = [
      { type: "expense", accountId: "a1", amount: 5.55, amountInPreferred: 876.9 },
    ];
    assert.equal(accountBalance(ACCOUNT, txns, []), -876.9);
  });

  test("debits the source and credits the destination of a transfer", () => {
    const transfers = [
      { fromAccountId: "a1", toAccountId: "a2", amount: 300 },
    ];
    assert.equal(accountBalance(ACCOUNT, [], transfers), -300);
    assert.equal(accountBalance({ id: "a2", openingBalance: 0 }, [], transfers), 300);
  });

  test("a transfer between other accounts does not move this one", () => {
    const transfers = [
      { fromAccountId: "a3", toAccountId: "a4", amount: 300 },
    ];
    assert.equal(accountBalance(ACCOUNT, [], transfers), 0);
  });

  test("a transfer uses the frozen snapshot when one exists", () => {
    const transfers = [
      { fromAccountId: "a1", toAccountId: "a2", amount: 10, amountInPreferred: 1580 },
    ];
    assert.equal(accountBalance(ACCOUNT, [], transfers), -1580);
  });

  test("combines opening balance, transactions and transfers", () => {
    const balance = accountBalance(
      { id: "a1", openingBalance: 500 },
      [
        { type: "income", accountId: "a1", amount: 2000 },
        { type: "expense", accountId: "a1", amount: 250 },
      ],
      [
        { fromAccountId: "a1", toAccountId: "a2", amount: 100 },
        { fromAccountId: "a2", toAccountId: "a1", amount: 40 },
      ]
    );
    // 500 + 2000 - 250 - 100 + 40
    assert.equal(balance, 2190);
  });

  test("a credit account goes negative when spent beyond its limit", () => {
    const balance = accountBalance(
      { id: "a1", openingBalance: 0 },
      [{ type: "expense", accountId: "a1", amount: 750 }],
      []
    );
    assert.equal(balance, -750);
  });
});

describe("netWorth", () => {
  test("is zero with no accounts", () => {
    assert.equal(netWorth([]), 0);
  });

  test("sums every counted account", () => {
    assert.equal(
      netWorth([
        { balance: 100 },
        { balance: 250.5 },
        { balance: -50 },
      ]),
      300.5
    );
  });

  test("excludes accounts opted out of net worth", () => {
    assert.equal(
      netWorth([
        { balance: 100, includeInNetWorth: true },
        { balance: 999, includeInNetWorth: false },
      ]),
      100
    );
  });

  test("treats a missing includeInNetWorth as included", () => {
    assert.equal(netWorth([{ balance: 100 }]), 100);
  });

  test("excludes archived accounts by default", () => {
    assert.equal(
      netWorth([
        { balance: 100 },
        { balance: 999, isArchived: true },
      ]),
      100
    );
  });

  test("includes archived accounts when asked", () => {
    assert.equal(
      netWorth(
        [
          { balance: 100 },
          { balance: 999, isArchived: true },
        ],
        { includeArchived: true }
      ),
      1099
    );
  });

  test("skips a non-numeric balance instead of poisoning the total with NaN", () => {
    // Postgres numeric arrives as a string; a bad value must not zero the sum.
    assert.equal(
      netWorth([{ balance: 100 }, { balance: Number.NaN }, { balance: 50 }]),
      150
    );
  });
});

describe("isMissingAccountTableError", () => {
  test("detects an unknown table/view", () => {
    assert.equal(isMissingAccountTableError({ code: "PGRST204" }), true);
    assert.equal(isMissingAccountTableError({ code: "42P01" }), true);
  });

  test("detects a missing table named in the message", () => {
    assert.equal(
      isMissingAccountTableError({
        message: 'relation "public.account" does not exist',
      }),
      true
    );
  });

  test("does NOT fire on an ordinary query failure", () => {
    assert.equal(isMissingAccountTableError({ code: "42501", message: "permission denied" }), false);
    assert.equal(isMissingAccountTableError({ message: "something else broke" }), false);
    assert.equal(isMissingAccountTableError(null), false);
    assert.equal(isMissingAccountTableError(undefined), false);
  });

  test("does not fire merely because a message mentions account_id", () => {
    // The transactions route filters on account_id all the time; treating that
    // as a missing-table signal would break every ledger read.
    assert.equal(
      isMissingAccountTableError({ message: "invalid input syntax for account_id" }),
      false
    );
  });
});

describe("ACCOUNT_TYPES", () => {
  test("covers every type the DB check constraint allows", () => {
    // Mirrors the `check (type in (...))` in docs/accounts.md. If these drift,
    // the API would accept a value the database rejects with a raw 500.
    assert.deepEqual([...ACCOUNT_TYPES].sort(), [
      "cash",
      "checking",
      "credit",
      "investment",
      "loan",
      "savings",
    ]);
  });
});