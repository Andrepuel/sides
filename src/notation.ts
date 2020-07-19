import { assert } from 'https://deno.land/std/testing/asserts.ts';

export type Code = string | Node;
export interface Node {
    genCode(): Code | Code[];
}

class BaseReader {
    private node: Code[];
    constructor(node: Code | Code[]) {
        if (node instanceof Array) {
            this.node = node;
        } else {
            this.node = [node];
        }
    }

    read(): string | null {
        const nextNode = this.node.shift();
        if (!nextNode) {
            return null;
        }

        const nextText = this.genCode(nextNode);
        if (typeof nextText === 'string') {
            return nextText + '\n';
        } else {
            if (nextText instanceof Array) {
                this.node = nextText.concat(this.node);
            } else {
                this.node = [nextText as Code].concat(this.node);
            }
            return this.read();
        }
    }

    private genCode(nextNode: Code): Code | Code[] {
        if (typeof nextNode === 'string') {
            return nextNode;
        }

        return nextNode.genCode();
    }
}

export class Reader implements Deno.Reader {
    private reader: BaseReader;
    constructor(node: Code | Code[]) {
        this.reader = new BaseReader(node);
    }

    async read(p: Uint8Array): Promise<number | null> {
        const nextText = this.reader.read();

        if (nextText === null) {
            return null;
        }

        const encoder = new TextEncoder();
        const utf8 = encoder.encode(nextText);
        assert(p.length >= utf8.length);
        p.set(utf8);
        return utf8.length;
    }
}

export function codeToString(node: Code | Code[]): string {
    const result: string[] = [];
    const reader = new BaseReader(node);
    let next: string | null;

    while ((next = reader.read()) !== null) {
        result.push(next);
    }

    return result.join('');
}
