import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { assertEquals } from '../assert.ts';
import * as c from './c.ts';
import * as ctx from '../context.ts';
import { Node } from '../notation.ts';
import { suite } from 'https://raw.githubusercontent.com/Andrepuel/testtree/ea4c72f0627d87c0284d0ba1952e9c33c0a1de30/mod.ts';

suite('c', (t) => {
    t.suite('primitive int', (t) => {
        const primitive = new c.PrimitiveType('i32');

        t.test('name matches i32', () => {
            assertEquals(primitive.name, 'i32');
        });

        t.test('param name matches C type name', () =>
            assertEquals(primitive.paramname, 'int'),
        );
    });

    t.suite('primitive type', (t) => {
        function equals(name: string, expected: string) {
            t.test(`${name} paramname will be ${expected}`, () => {
                assertEquals(new c.PrimitiveType(name).paramname, expected);
            });
        }

        equals('i8', 'char');
        equals('i16', 'short');
        equals('i32', 'int');
        equals('i64', 'long long');
        equals('long', 'long');
        equals('u8', 'unsigned char');
        equals('u16', 'unsigned short');
        equals('u32', 'unsigned int');
        equals('u64', 'unsigned long long');
        equals('size', 'unsigned long');
        equals('void', 'void');
    });

    const simpleCtype: c.Type = {
        name: 'custom',
        paramname: 'custom_t*',
    };

    class CoisaFunction extends c.Function {
        constructor(public args: c.NameType[] = []) {
            super();
        }

        name: string = 'coisa';
        ret: c.Type = simpleCtype;
        asyncMethod: boolean = false;
        staticMethod: boolean = false;
    }

    t.suite('function with args', (t) => {
        const func = new CoisaFunction([
            { name: 'a1', type: simpleCtype },
            { name: 'a2', type: simpleCtype },
        ]);

        t.test('generates with the given args', () => {
            assertEquals(
                func.genCode(),
                'custom_t* coisa(custom_t* a1, custom_t* a2);',
            );
        });
    });

    t.suite('function', (t) => {
        const func = new CoisaFunction();

        t.test('generates header code as string', () => {
            assertEquals(func.genCode(), 'custom_t* coisa();');
        });
    });

    class CoisaClass extends c.Class {
        constructor(public methods: c.Function[] = []) {
            super();
        }
        name: string = 'coisa_t';
    }

    t.suite('class with methods', (t) => {
        const clss = new CoisaClass([new CoisaFunction()]);

        t.test('code will be stub followed by functions', () => {
            assertEquals(clss.genCode(), [clss.stub, new CoisaFunction()]);
        });
    });

    class AFile extends c.File {
        constructor(public content: Node[] = []) {
            super();
        }
        name: string = 'name';
    }

    t.suite('c file', (t) => {
        const file = new AFile([new CoisaClass()]);

        t.test('gen code is pragma once and contents', () => {
            assertEquals(
                file.genCode(),
                [new c.PragmaOnce() as Node].concat([new CoisaClass()]),
            );
        });
    });

    t.suite('class', (t) => {
        const clss = new CoisaClass();

        t.test('has stub', () => {
            assertEquals(clss.stub, new c.Stub('coisa_t'));
        });

        t.test('param name is pointer', () => {
            assertEquals(clss.paramname, 'coisa_t*');
        });

        t.suite("'s file", (t) => {
            const file = clss.file();

            t.test('is named after the class with .h extension', () => {
                assertEquals(file.name, 'coisa.h');
            });

            t.test('content is the class itself', () => {
                assertEquals(file.content, [clss]);
            });
        });
    });

    t.suite('struct stub', (t) => {
        const stub = new c.Stub('coisa_t');

        t.test('generates stub code', () => {
            assertEquals(stub.genCode(), 'typedef struct coisa_s coisa_t;');
        });
    });

    t.suite('pragma once', (t) => {
        const pragma = new c.PragmaOnce();

        t.test('code is #pragma once', () => {
            assertEquals(pragma.genCode(), '#pragma once');
        });
    });

    t.suite('context:', (t) => {
        class CContext implements c.Context {
            types: { [name: string]: c.Type | undefined } = {
                Coisa: new CoisaClass(),
                Custom: simpleCtype,
                void: new c.PrimitiveType('void'),
            };

            cType(name: string): c.Type | undefined {
                return this.types[name];
            }
        }

        const staticSpec: ctx.Method = {
            name: 'aMethod',
            args: [
                {
                    name: 'a1',
                    type: { name: 'Custom' },
                },
            ],
            ret: { name: 'void' },
            staticMethod: true,
            asyncMethod: false,
        };

        const context = new CContext();

        t.suite('spec based c static method', (t) => {
            const method = new c.SpecMethod(staticSpec, context);

            t.test('name is snake case', () => {
                assertEquals(method.name, 'a_method');
            });

            t.test('args are converted to c types', () => {
                assertEquals(method.args, [
                    {
                        name: 'a1',
                        type: simpleCtype,
                    },
                ]);
            });

            t.test('ret is converted to c types', () => {
                assertEquals(method.ret, new c.PrimitiveType('void'));
            });

            t.test('is not async', () => {
                assertEquals(method.asyncMethod, false);
            });

            t.test('is static', () => {
                assertEquals(method.staticMethod, true);
            });
        });

        const memberSpec: ctx.Method = {
            ...staticSpec,
            staticMethod: false,
        };

        t.suite('spec based c method non-static method', (t) => {
            const method = new c.MemberSpecMethod(
                new CoisaClass(),
                memberSpec,
                context,
            );

            t.test('has self as first parameter', () => {
                assertEquals(method.args, [
                    {
                        name: '_sides_self',
                        type: new CoisaClass(),
                    },
                    {
                        name: 'a1',
                        type: simpleCtype,
                    },
                ]);
            });

            t.test('is not marked as static method', () => {
                assertEquals(method.staticMethod, false);
            });
        });

        t.suite('given a class specification,', (t) => {
            const classSpec: ctx.Class = {
                name: 'CoisaDeCamelo',
                languages: [],
                methods: [staticSpec, memberSpec],
            };

            t.suite('the spec based class', (t) => {
                const clss = new c.ClassSpec(classSpec, context);

                t.test('name is camel case', () => {
                    assertEquals(clss.name, 'coisa_de_camelo_t');
                });

                t.test('methods are converted to spec methods', () => {
                    assertEquals(clss.methods, [
                        new c.SpecMethod(staticSpec, context),
                        new c.MemberSpecMethod(clss, memberSpec, context),
                    ]);
                });
            });

            t.suite("the main context's", (t) => {
                const context = new ctx.Context([classSpec]);

                t.test('cType of a class is a c.Class', () => {
                    assertEquals(
                        context.cType('CoisaDeCamelo'),
                        new c.ClassSpec(classSpec, context),
                    );
                });

                for (let name of [
                    'i8',
                    'i16',
                    'i32',
                    'i64',
                    'long',
                    'u8',
                    'u16',
                    'u32',
                    'u64',
                    'size',
                    'void',
                ]) {
                    t.test(`cType of ${name} is a c.Primitive`, () => {
                        assertEquals(
                            context.cType(name),
                            new c.PrimitiveType(name),
                        );
                    });
                }

                t.test('cType of anything else is undefined', () => {
                    assertEquals(context.cType('inexistent'), undefined);
                });
            });
        });
    });
});
