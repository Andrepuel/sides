import * as ffi from 'ffi';
import * as ref from 'ref';

const lib = ffi.Library('./liboi.so', {
    'sides_set_fromJs': ['void', ['void*']],
    '_sides_main': ['void', []],
});

const ThingInstances = new Array<Thing>();
const ThingVtable = {
    destroy: ffi.Callback('void', ['void*'], (sides_self: Buffer) => {
        sides_self = ref.reinterpret(sides_self, 12);
        console.log('js destroy called');
        delete ThingInstances[sides_self.readUInt32LE(8)];
    }),
    number: ffi.Callback('int', ['void*'], (sides_self: Buffer) => {
        sides_self = ref.reinterpret(sides_self, 12);
        return ThingInstances[sides_self.readUInt32LE(8)].number();
    }),
}
console.log({ThingVtable});
interface Thing {
    number(): number;
}

function fromJs(): Thing {
    return {
        number: () => ThingInstances.length,
    };
}

lib.sides_set_fromJs(ffi.Callback('void*', [], () => {
    const vtable = Buffer.alloc(16);
    ref.writePointer(vtable, 0, ThingVtable.destroy);
    ref.writePointer(vtable, 8, ThingVtable.number);

    const instance = Buffer.alloc(12);
    ref.writePointer(instance, 0, vtable);
    instance.writeUInt32LE(ThingInstances.push(fromJs()) - 1, 8);

    console.log('returning instance');
    console.log({vtable, instance});
    return instance;
}));
lib._sides_main();