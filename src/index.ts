import { Context, parse } from './context.ts';
import { ensureDir } from 'https://deno.land/std/fs/mod.ts';
import * as c from './language/c.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { Reader } from './notation.ts';

const file = Deno.args[0];
const outdir = Deno.args[1];

const elems = parse(await Deno.readTextFile(file));
const context = new Context(elems);
await ensureDir(outdir);

for (let elem of elems) {
    const cElem = context.cType(elem.name);
    assert(cElem instanceof c.Class);
    const file = cElem.file();
    const open = await Deno.open(`${outdir}/${file.name}`, {
        create: true,
        write: true,
    });
    for await (const chunk of Deno.iter(new Reader(file))) {
        await Deno.writeAll(open, chunk);
    }
}
