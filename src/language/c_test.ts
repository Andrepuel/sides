import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { assertEquals } from '../assert.ts';
import * as c from './c.ts';
import * as ctx from '../context.ts';
import { Node } from '../notation.ts';
import { suite } from '../testing.ts';

suite('c', (test) => {
    test.given('primitive int', () => new c.PrimitiveType('i32'))
        .it('name matches i32', (primitive) =>
            assertEquals(primitive.name, 'i32'),
        )
        .it('param name matches C type name', (primitive) =>
            assertEquals(primitive.paramname, 'int'),
        );

    test.params<string>()
        .given(
            'the paramname for primitive',
            (name) => new c.PrimitiveType(name).paramname,
        )
        .equals('i8', 'i8', 'char')
        .equals('i16', 'i16', 'short')
        .equals('i32', 'i32', 'int')
        .equals('i64', 'i64', 'long long')
        .equals('long', 'long', 'long')
        .equals('u8', 'u8', 'unsigned char')
        .equals('u16', 'u16', 'unsigned short')
        .equals('u32', 'u32', 'unsigned int')
        .equals('u64', 'u64', 'unsigned long long')
        .equals('size', 'size', 'unsigned long')
        .equals('void', 'void', 'void');

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

    test.params<{ args?: c.NameType[] }>()
        .given('a function', (suite) => new CoisaFunction(suite.args || []))
        .with(
            {
                args: [
                    { name: 'a1', type: simpleCtype },
                    { name: 'a2', type: simpleCtype },
                ],
            },
            (test) => {
                test.it('generates the givens args', (func) => {
                    assertEquals(
                        func.genCode(),
                        'custom_t* coisa(custom_t* a1, custom_t* a2);',
                    );
                });
            },
        )
        .with({}, (test) => {
            test.it('generates header code as a string', (func) => {
                assertEquals(func.genCode(), 'custom_t* coisa();');
            });
        });

    class CoisaClass extends c.Class {
        constructor(public methods: c.Function[] = []) {
            super();
        }
        name: string = 'coisa_t';
    }

    test.params<{ methods?: c.Function[] }>()
        .given('a class', (suite) => new CoisaClass(suite.methods || []))
        .with(
            {
                methods: [new CoisaFunction()],
            },
            (test) => {
                test.it('code will be stub folowed by functions', (clss) => {
                    assertEquals(clss.genCode(), [
                        clss.stub,
                        new CoisaFunction(),
                    ]);
                });
            },
        )
        .with({}, (test) => {
            test.it('has stub', (clss) => {
                assertEquals(clss.stub, new c.Stub('coisa_t'));
            }).it('param name is pointer', (clss) => {
                assertEquals(clss.paramname, 'coisa_t*');
            });
        });
    class AFile extends c.File {
        constructor(public content: Node[] = []) {
            super();
        }
        name: string = 'name';
    }

    test.given('c file', () => new AFile([new CoisaClass()])).it(
        'gen code is pragma once and contents',
        (file) => {
            assertEquals(
                file.genCode(),
                [new c.PragmaOnce() as Node].concat([new CoisaClass()]),
            );
        },
    );

    test.given('c file of the class', () => new CoisaClass().file())
        .it('is named after the class with .h extension', (file) =>
            assertEquals(file.name, 'coisa.h'),
        )
        .it('content is the class itself', (file) =>
            assertEquals(file.content, [new CoisaClass()]),
        );

    test.given('struct stub', () => new c.Stub('coisa_t')).it(
        'generates stub code',
        (stub) => {
            assertEquals(stub.genCode(), 'typedef struct coisa_s coisa_t;');
        },
    );

    test.given('pragma once', () => new c.PragmaOnce()).it(
        'code is #pragma once',
        (pragma) => {
            assertEquals(pragma.genCode(), '#pragma once');
        },
    );

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

    test.given(
        'a method spec',
        () => new c.SpecMethod(staticSpec, new CContext()),
    )
        .it('name is snake case', (method) => {
            assertEquals(method.name, 'a_method');
        })
        .it('args are converted to c types', (method) => {
            assertEquals(method.args, [
                {
                    name: 'a1',
                    type: simpleCtype,
                },
            ]);
        })
        .it('ret is converted to c types', (method) => {
            assertEquals(method.ret, new c.PrimitiveType('void'));
        })
        .it('is not async', (method) => {
            assertEquals(method.asyncMethod, false);
        })
        .it('is static', (method) => {
            assertEquals(method.staticMethod, true);
        });

    const memberSpec: ctx.Method = {
        ...staticSpec,
        staticMethod: false,
    };

    const context = new CContext();
    test.given(
        'a member spec',
        () => new c.MemberSpecMethod(new CoisaClass(), memberSpec, context),
    )
        .it('has self as first parameter', (method) => {
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
        })
        .it('is not marked as static method', (method) => {
            assertEquals(method.staticMethod, false);
        });

    const classSpec: ctx.Class = {
        name: 'CoisaDeCamelo',
        languages: [],
        methods: [staticSpec, memberSpec],
    };

    test.given('a class test', () => new c.ClassSpec(classSpec, context))
        .it('name is camel case', (clss) => {
            assertEquals(clss.name, 'coisa_de_camelo_t');
        })
        .it('methods are converted to spec methods', (clss) => {
            assertEquals(clss.methods, [
                new c.SpecMethod(staticSpec, context),
                new c.MemberSpecMethod(clss, memberSpec, context),
            ]);
        });

    test.given('a context', () => new ctx.Context([classSpec]))
        .it('cType of a class is a c.Class', (context) => {
            assertEquals(
                context.cType('CoisaDeCamelo'),
                new c.ClassSpec(classSpec, context),
            );
        })
        .it('cType of a primitive is a c.Primitive', (context) => {
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
                assertEquals(context.cType(name), new c.PrimitiveType(name));
            }
        })
        .it('cType of anything else is undefined', (context) => {
            assertEquals(context.cType('inexistent'), undefined);
        });
});
