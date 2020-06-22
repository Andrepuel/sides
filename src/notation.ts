import { assert } from 'https://deno.land/std/testing/asserts.ts';

export interface Node {
    genCode(): string | Node[];
}

export class Reader implements Deno.Reader {
    private node: Node[];
    constructor(node: Node) {
        this.node = [node];
    }

    async read(p: Uint8Array): Promise<number | null> {
        const encoder = new TextEncoder();

        const nextNode = this.node.shift();
        if (!nextNode) {
            return null;
        }

        const nextText = nextNode.genCode();
        if (typeof nextText === 'string') {
            const utf8 = encoder.encode(nextText + '\n');
            assert(p.length >= utf8.length);
            p.set(utf8);
            return utf8.length;
        } else {
            this.node = nextText.concat(this.node);
            return await this.read(p);
        }
    }
}
