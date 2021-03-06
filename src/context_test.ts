import { assert, assertEquals } from 'std/testing/asserts.ts';
import { suite } from 'testtree';
import {
    parse,
    Class,
    Enum,
    Setting,
    Method,
    Interface,
    StaticMethodIntoClass,
} from './context.ts';

suite('parser', (t) => {
    t.suite('class', (t) => {
        function equals(name: string, spec: string, expect: Class) {
            t.test(name, () => {
                assertEquals(parse(spec)[0], expect);
            });
        }

        equals('with empty spec', 'Use = class {}', {
            name: 'Use',
            languages: [],
            methods: [],
        });

        equals('with languages', 'Use = class +o +c {}', {
            name: 'Use',
            languages: ['o', 'c'],
            methods: [],
        });

        equals('with methods', 'Use = class { bola(); quadrado(); }', {
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
    });

    t.suite('interface', (t) => {
        function equals(name: string, spec: string, expect: Interface) {
            t.test(name, () => {
                assertEquals(parse(spec)[0], expect);
            });
        }

        equals('with empty spec', 'Use = interface {}', {
            name: 'Use',
            methods: [],
        });

        equals('with methods', 'Use = interface { bola(); quadrado(); }', {
            name: 'Use',
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

        t.test('with static methods will fail', () => {
            try {
                parse('Use = interface { static bola(); }');
                assert(false);
            } catch (e) {
                assert(e instanceof StaticMethodIntoClass);
                assertEquals(e.name, 'Use');
                assertEquals(e.method, 'bola');
                assertEquals(
                    e.message,
                    'Interfaces may not have static method (Use::bola)',
                );
            }
        });
    });

    t.test('multiple elements', () => {
        const spec =
            'e = enum { bola; } f = class +o { } outro = class { } mais_enum = enum {} ';
        assertEquals(parse(spec), [
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
        ]);
    });

    t.suite('method', (t) => {
        function equals(name: string, spec: string, expect: Method) {
            t.test(name, () => {
                const methods = parse(`Placeholder = class { ${spec} }`)[0]
                    .methods;
                assert(methods);
                assertEquals(methods[0], expect);
            });
        }

        equals('with no params', 'bola();', {
            asyncMethod: false,
            name: 'bola',
            args: [],
            staticMethod: false,
            ret: {
                name: 'void',
            },
        });

        equals('being static', 'static bola();', {
            asyncMethod: false,
            name: 'bola',
            args: [],
            staticMethod: true,
            ret: {
                name: 'void',
            },
        });

        equals('having return type', 'bola(): i8;', {
            asyncMethod: false,
            name: 'bola',
            staticMethod: false,
            args: [],
            ret: {
                name: 'i8',
            },
        });

        equals('having args', 'bola(a: i8, b:i16);', {
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
        });

        equals('being async', 'async bola();', {
            name: 'bola',
            staticMethod: false,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        });

        equals('being async and static', 'async static bola();', {
            name: 'bola',
            staticMethod: true,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        });

        equals('being static and async', 'static async bola();', {
            name: 'bola',
            staticMethod: true,
            asyncMethod: true,
            args: [],
            ret: {
                name: 'void',
            },
        });
    });

    t.suite('setting', (t) => {
        function equals(name: string, spec: string, expect: Setting) {
            t.test(name, () => {
                assertEquals(parse(spec)[0], expect);
            });
        }

        equals('using legacy format', '# ola = "valor" #', {
            name: 'ola',
            value: 'valor',
        });

        equals('using equals based format', 'ola = "valor"', {
            name: 'ola',
            value: 'valor',
        });

        equals('using escaped string', 'ola = "out\\"ro"', {
            name: 'ola',
            value: 'out"ro',
        });
    });
});
