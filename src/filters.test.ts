import { assert, assertFalse } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { olderThanDays } from "./filters.ts";
import { IssueData } from "./types.ts";

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 5);
const date = yesterday.toISOString().split('T')[0];


Deno.test("old Than days", () => {
    const issue = {
        updated_at: date,
    } as IssueData;
    assert(olderThanDays(issue, 1));
    assertFalse(olderThanDays(issue, 10));
});
