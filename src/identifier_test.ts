import { Identifier } from './identifier.ts';
import { assertEquals } from './assert.ts';
import { suite } from './testing.ts';

suite('identifier', (test) => {
    test.given('identifier', () => new Identifier(['a', 'b'])).it(
        'can be formated t snake case',
        (id) => {
            assertEquals(id.toSnake(), 'a_b');
        },
    );

    test.it('may be created from camel case', () => {
        assertEquals(Identifier.fromCamel('helloPrettyWorld').comps, [
            'hello',
            'pretty',
            'world',
        ]);
    });
});
