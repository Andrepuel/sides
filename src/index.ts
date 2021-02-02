import { Context, parse } from './context.ts';
import { ensureDir } from 'std/fs/mod.ts';
import * as c from './language/c.ts';
import { assert } from 'std/testing/asserts.ts';
import { Reader } from './notation.ts';

const file = Deno.args[0];
const outdir = Deno.args[1];

const elems = parse(await Deno.readTextFile(file));
const context = new Context(elems);
await ensureDir(outdir);

for (const elem of elems) {
    const cElem = context.cType(elem.name);
    assert(cElem instanceof c.Class || cElem instanceof c.Interface);
    const file = cElem.file();
    const open = await Deno.open(`${outdir}/${file.name}`, {
        create: true,
        write: true,
    });
    for await (const chunk of Deno.iter(new Reader(file))) {
        await Deno.writeAll(open, chunk);
    }
}
