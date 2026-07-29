/** An iterable that may be async. */
export type MaybeAsyncIterable<T> = Iterable<T> | AsyncIterable<T>;

async function* generateAsync<T, U>(
  iterable: MaybeAsyncIterable<T>,
  cb: (value: T, index: number) => Promise<U>,
) {
  let index = 0;
  for await (const value of iterable) {
    yield await cb(value, index++);
  }
}

/**
 * Maps an async or sync iterable over an async callback.
 * @template T - The input type
 * @template U - The output type
 * @param iterable - The iterable to map over
 * @param cb - The async callback
 * @returns An array of mapped values
 */
export async function mapAsync<T, U>(
  iterable: MaybeAsyncIterable<T>,
  cb: (value: T, index: number) => Promise<U>,
) {
  const generator = generateAsync(iterable, cb);
  const items: U[] = [];
  for await (const item of generator) {
    items.push(item);
  }
  return items;
}
