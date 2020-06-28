import { Node, Reader } from './notation.ts';
import { assertEquals } from './assert.ts';
import { suite } from './testing.ts';

class NodeImpl implements Node {
    constructor(private _genCode: Node[] | string) {}

    genCode(): Node[] | string {
        return this._genCode;
    }
}

suite('node', (test) => {
    test.given(
        'a node tree',
        () =>
            new NodeImpl([
                new NodeImpl('a'),
                new NodeImpl([new NodeImpl('b'), new NodeImpl('c')]),
                new NodeImpl('d'),
            ]),
    ).it('may be converted into actual code using reader', async (node) => {
        const reader = new Reader(node);

        const decoder = new TextDecoder('utf-8');
        assertEquals(
            decoder.decode(await Deno.readAll(reader)),
            'a\nb\nc\nd\n',
        );
    });
});
