import { Node, Reader } from './notation.ts';
import { assertEquals } from './assert.ts';
import { suite } from 'https://raw.githubusercontent.com/Andrepuel/testtree/ea4c72f0627d87c0284d0ba1952e9c33c0a1de30/mod.ts';

await suite('node', async (t) => {
    await t.suite('a node tree', async () => {
        class NodeImpl implements Node {
            constructor(private _genCode: Node[] | string) {}

            genCode(): Node[] | string {
                return this._genCode;
            }
        }

        const node = new NodeImpl([
            new NodeImpl('a'),
            new NodeImpl([new NodeImpl('b'), new NodeImpl('c')]),
            new NodeImpl('d'),
        ]);

        await t.test(
            'may be converted into actual code using reader',
            async () => {
                const reader = new Reader(node);

                const decoder = new TextDecoder('utf-8');
                assertEquals(
                    decoder.decode(await Deno.readAll(reader)),
                    'a\nb\nc\nd\n',
                );
            },
        );
    });
});
