import { describe, expect, test } from "vitest";
import { groupBy } from "../group-by";

describe("groupBy", () => {
  test("groups objects by string property", () => {
    const items = [
      { name: "Alice", team: "A" },
      { name: "Bob", team: "B" },
      { name: "Charlie", team: "A" },
    ];

    const result = groupBy(items, item => item.team);

    expect(result).toEqual({
      A: [
        { name: "Alice", team: "A" },
        { name: "Charlie", team: "A" },
      ],
      B: [{ name: "Bob", team: "B" }],
    });
  });

  test("returns empty object for empty array", () => {
    const result = groupBy([], () => "key");

    expect(result).toEqual({});
  });

  test("creates single-item groups", () => {
    const items = [
      { id: 1, category: "A" },
      { id: 2, category: "B" },
      { id: 3, category: "C" },
    ];

    const result = groupBy(items, item => item.category);

    expect(result.A).toHaveLength(1);
    expect(result.B).toHaveLength(1);
    expect(result.C).toHaveLength(1);
  });

  test("groups multiple items under same key", () => {
    const items = [
      { value: 1, group: "same" },
      { value: 2, group: "same" },
      { value: 3, group: "same" },
    ];

    const result = groupBy(items, item => item.group);

    expect(result.same).toHaveLength(3);
    expect(result.same).toEqual(items);
  });

  test("works with numeric keys", () => {
    const items = [
      { name: "a", score: 100 },
      { name: "b", score: 200 },
      { name: "c", score: 100 },
    ];

    const result = groupBy(items, item => item.score);

    expect(result[100]).toHaveLength(2);
    expect(result[200]).toHaveLength(1);
  });

  test("works with symbol keys", () => {
    const sym1 = Symbol("key1");
    const sym2 = Symbol("key2");

    const items = [
      { data: "a", key: sym1 },
      { data: "b", key: sym2 },
      { data: "c", key: sym1 },
    ];

    const result = groupBy(items, item => item.key);

    expect(result[sym1]).toHaveLength(2);
    expect(result[sym2]).toHaveLength(1);
  });

  test("uses complex key function", () => {
    const items = [
      { firstName: "John", lastName: "Doe" },
      { firstName: "Jane", lastName: "Doe" },
      { firstName: "Bob", lastName: "Smith" },
    ];

    const result = groupBy(items, item => item.lastName);

    expect(result.Doe).toHaveLength(2);
    expect(result.Smith).toHaveLength(1);
  });

  test("preserves order within groups", () => {
    const items = [
      { id: 1, type: "A" },
      { id: 2, type: "B" },
      { id: 3, type: "A" },
      { id: 4, type: "A" },
    ];

    const result = groupBy(items, item => item.type);

    expect(result.A[0].id).toBe(1);
    expect(result.A[1].id).toBe(3);
    expect(result.A[2].id).toBe(4);
  });

  test("works with primitive values", () => {
    const numbers = [1, 2, 3, 4, 5, 6];

    const result = groupBy(numbers, n => (n % 2 === 0 ? "even" : "odd"));

    expect(result.odd).toEqual([1, 3, 5]);
    expect(result.even).toEqual([2, 4, 6]);
  });
});
