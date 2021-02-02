import { Node, Reader, codeToString, Code } from './notation.ts';
import { assertEquals } from './assert.ts';
import { suite } from 'testtree';

await suite('node', async (t) => {
    class NodeImpl implements Node {
        constructor(private _genCode: Code | Code[]) {}

        genCode(): Code | Code[] {
            return this._genCode;
        }
    }

    await t.suite('a node tree', async (t) => {
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

        await t.test('a list of nodes may be passed to reader', async () => {
            const reader = new Reader(['before', node, 'after']);

            const decoder = new TextDecoder('utf-8');
            assertEquals(
                decoder.decode(await Deno.readAll(reader)),
                'before\na\nb\nc\nd\nafter\n',
            );
        });

        t.test('may be converted into string', () => {
            assertEquals(codeToString(node), 'a\nb\nc\nd\n');
        });

        t.test('a list of node may be converted to string', () => {
            assertEquals(codeToString(['a', 'b', 'c']), 'a\nb\nc\n');
        });
    });
    t.test('gencode may return another node', () => {
        assertEquals(codeToString(new NodeImpl(new NodeImpl('a'))), 'a\n');
    });
});
