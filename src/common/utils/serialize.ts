/**
 * Shared BigInt/JSON serialization helpers.
 *
 * BigInt values crash JSON.stringify ("Do not know how to serialize a
 * BigInt"). `main.ts` patches `BigInt.prototype.toJSON` globally with
 * `bigIntToNumber`, so in most cases you don't need to do anything.
 *
 * Use `serializeBigInts` only when you need a plain (already-serialized)
 * object in service code, e.g. before logging or when a consumer expects
 * a plain JSON-compatible structure.
 */

/** The single source of truth for BigInt → JSON conversion. */
export function bigIntToNumber(value: bigint): number {
  return Number(value);
}

/**
 * Recursively converts BigInt values to numbers and returns a plain
 * JSON-compatible object.
 *
 * Returns `any` (like `JSON.parse(JSON.stringify(...))`) because callers
 * typically treat the result as a plain mutable object, not as the
 * original Prisma entity type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeBigInts<T>(value: T): any {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? bigIntToNumber(v) : v)),
  );
}
