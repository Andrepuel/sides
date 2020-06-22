import { Identifier } from './identifier.ts';
import { assertEquals } from './assert.ts';

Deno.test('to snake case joins using underline', () => {
    assertEquals(new Identifier(['a', 'b']).toSnake(), 'a_b');
});

Deno.test('from camel case splits on every letter that is uppercase', () => {
    assertEquals(Identifier.fromCamel('helloPrettyWorld').comps, [
        'hello',
        'pretty',
        'world',
    ]);
});
