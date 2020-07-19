import { Identifier } from './identifier.ts';
import { assertEquals } from './assert.ts';
import { suite } from 'https://raw.githubusercontent.com/Andrepuel/testtree/bceb00dbaa889b88513dc2d31730807524f4c1d0/mod.ts';

suite('identifier', (t) => {
    t.suite('identifier', (t) => {
        const id = new Identifier(['a', 'b']);

        t.test('can be formated with snake case', () => {
            assertEquals(id.toSnake(), 'a_b');
        });
    });

    t.test('may be created from camel case', () => {
        assertEquals(Identifier.fromCamel('helloPrettyWorld').comps, [
            'hello',
            'pretty',
            'world',
        ]);
    });

    t.test('may be created from snake case', () => {
        assertEquals(Identifier.fromSnake('hello_pretty_world').comps, [
            'hello',
            'pretty',
            'world',
        ]);
    });
});
