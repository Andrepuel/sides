import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { suite } from './testing.ts';
import { parse, Class, Enum, Setting } from './context.ts';

suite('parser', (test) => {
    test.params<string>()
        .given('class', (spec) => parse(spec)[0] as Class)
        .equals('with empty spec', 'Use = interface {}', {
            name: 'Use',
            languages: [],
            methods: [],
        })
        .equals('with languages', 'Use = interface +o +c {}', {
            name: 'Use',
            languages: ['o', 'c'],
            methods: [],
        })
        .equals('with methods', 'Use = interface { bola(); quadrado(); }', {
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
        });

    test.params<string>()
        .given('multiple elements', (spec: string) => parse(spec))
        .equals(
            'being enum and class',
            'e = enum { bola; } f = interface +o { } outro = interface { } mais_enum = enum {} ',
            [
                {
                    name: 'e',
                    values: ['bola'],
                } as Enum,
                {
                    name: 'f',
                    languages: ['o'],
                    methods: [],
                } as Class,
                {
                    name: 'outro',
                    languages: [],
                    methods: [],
                },
                {
                    name: 'mais_enum',
                    values: [],
                } as Enum,
            ],
        );

    test.params<string>()
        .given('method', (spec: string) => {
            let methods = parse(`Placeholder = interface { ${spec} }`)[0]
                .methods;
            assert(methods);
            return methods[0];
        })
        .equals('with no params', 'bola();', {
            asyncMethod: false,
            name: 'bola',
            args: [],
            staticMethod: false,
            ret: {
                name: 'void',
            },
        })
        .equals('being static', 'static bola();', {
            asyncMethod: false,
            name: 'bola',
            args: [],
            staticMethod: true,
            ret: {
                name: 'void',
            },
        })
        .equals('having return type', 'bola(): i8;', {
            asyncMethod: false,
            name: 'bola',
            staticMethod: false,
            args: [],
            ret: {
                name: 'i8',
            },
        })
        .equals('having args', 'bola(a: i8, b:i16);', {
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
        })
        .equals('being async', 'async bola();', {
            name: 'bola',
            staticMethod: false,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        })
        .equals('being async and static', 'async static bola();', {
            name: 'bola',
            staticMethod: true,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        })
        .equals('being static and async', 'static async bola();', {
            name: 'bola',
            staticMethod: true,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        });

    test.params<string>()
        .given('setting', (spec: string) => parse(spec)[0] as Setting)
        .equals('using legacy format', '# ola = "valor" #', {
            name: 'ola',
            value: 'valor',
        })
        .equals('using equals based format', 'ola = "valor"', {
            name: 'ola',
            value: 'valor',
        })
        .equals('using escaped string', 'ola = "out\\"ro"', {
            name: 'ola',
            value: 'out"ro',
        });
});
