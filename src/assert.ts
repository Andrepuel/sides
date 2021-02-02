import * as a from 'std/testing/asserts.ts';

export function some<T>(t: T | undefined): T {
    a.assert(t);
    return t;
}

export function assertEquals(
    actual: unknown,
    expected: unknown,
    msg?: string,
): void {
    a.assertEquals(actual, expected);

    if (actual && typeof actual === 'object') {
        a.assert(expected && typeof expected === 'object');
        a.assertEquals(actual.constructor, expected.constructor);
    }
}
