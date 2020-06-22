import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { assertEquals } from './assert.ts';
import { parse, Class, Method, Enum, Setting, Context } from './context.ts';

function classTest(spec: string, expected: Class): () => void {
    return () => {
        assertEquals(parse(spec)[0], expected);
    };
}
Deno.test(
    'empty class',
    classTest('Use = interface {}', {
        name: 'Use',
        languages: [],
        methods: [],
    }),
);

Deno.test(
    'class with languages',
    classTest('Use = interface +o +c {}', {
        name: 'Use',
        languages: ['o', 'c'],
        methods: [],
    }),
);

Deno.test(
    'class with method',
    classTest('Use = interface { bola(); quadrado(); }', {
        name: 'Use',
        languages: [],
        methods: [
            {
                asyncMethod: false,
                args: [],
                name: 'bola',
                ret: {
                    name: 'void',
                },
                staticMethod: false,
            },
            {
                asyncMethod: false,
                args: [],
                name: 'quadrado',
                ret: {
                    name: 'void',
                },
                staticMethod: false,
            },
        ],
    }),
);

Deno.test('enum', () => {
    const types = parse(
        'e = enum { bola; } f = interface +o { } outro = interface { } mais_enum = enum {} ',
    );
    const anEnum: Enum = {
        name: 'e',
        values: ['bola'],
    };
    assertEquals(types[0], anEnum);

    const anClass: Class = {
        name: 'f',
        languages: ['o'],
        methods: [],
    };

    assertEquals(types[1], anClass);
});

function methodTest(spec: string, expect: Method): () => void {
    return () => {
        let methods = parse(`Placeholder = interface { ${spec} }`)[0].methods;
        assert(methods);
        assertEquals(methods[0], expect);
    };
}

Deno.test(
    'simple method',
    methodTest('bola();', {
        asyncMethod: false,
        name: 'bola',
        args: [],
        staticMethod: false,
        ret: {
            name: 'void',
        },
    }),
);

Deno.test(
    'static method',
    methodTest('static bola();', {
        asyncMethod: false,
        name: 'bola',
        args: [],
        staticMethod: true,
        ret: {
            name: 'void',
        },
    }),
);

Deno.test(
    'method with ret',
    methodTest('bola(): i8;', {
        asyncMethod: false,
        name: 'bola',
        staticMethod: false,
        args: [],
        ret: {
            name: 'i8',
        },
    }),
);

Deno.test(
    'method with args',
    methodTest('bola(a: i8, b:i16);', {
        asyncMethod: false,
        name: 'bola',
        staticMethod: false,
        args: [
            {
                name: 'a',
                type: {
                    name: 'i8',
                },
            },
            {
                name: 'b',
                type: {
                    name: 'i16',
                },
            },
        ],
        ret: {
            name: 'void',
        },
    }),
);

Deno.test(
    'async method',
    methodTest('async bola();', {
        name: 'bola',
        staticMethod: false,
        asyncMethod: true,
        args: [],
        ret: {
            name: 'void',
        },
    }),
);

Deno.test(
    'async and static method',
    methodTest('async static bola();', {
        name: 'bola',
        staticMethod: true,
        asyncMethod: true,
        args: [],
        ret: {
            name: 'void',
        },
    }),
);

Deno.test(
    'static and async method',
    methodTest('static async bola();', {
        name: 'bola',
        staticMethod: true,
        asyncMethod: true,
        args: [],
        ret: {
            name: 'void',
        },
    }),
);

function settingTest(spec: string, expect: Setting): () => void {
    return () => {
        assertEquals(parse(spec)[0], expect);
    };
}

Deno.test(
    'legacy setting',
    settingTest('# ola = "valor" #', {
        name: 'ola',
        value: 'valor',
    }),
);

Deno.test(
    'new format setting',
    settingTest('ola = "valor"', {
        name: 'ola',
        value: 'valor',
    }),
);

Deno.test(
    'escape string setting',
    settingTest('ola = "out\\"ro"', {
        name: 'ola',
        value: 'out"ro',
    }),
);

Deno.test('c class', () => {
    const c = new Context([
        {
            name: 'a_class',
            methods: [],
            languages: [],
        },
    ]);
});
