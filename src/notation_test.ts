import { Node, Reader } from './notation.ts';
import { assertEquals } from './assert.ts';

class NodeImpl implements Node {
    constructor(private _genCode: Node[] | string) {}

    genCode(): Node[] | string {
        return this._genCode;
    }
}

Deno.test('nodes may be converted into code using a reader', async () => {
    const reader = new Reader(
        new NodeImpl([
            new NodeImpl('a'),
            new NodeImpl([new NodeImpl('b'), new NodeImpl('c')]),
            new NodeImpl('d'),
        ]),
    );

    const decoder = new TextDecoder('utf-8');
    assertEquals(decoder.decode(await Deno.readAll(reader)), 'a\nb\nc\nd\n');
});
