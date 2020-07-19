import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { assertEquals } from '../assert.ts';
import * as c from './c.ts';
import * as ctx from '../context.ts';
import { Node, codeToString } from '../notation.ts';
import { suite } from 'https://raw.githubusercontent.com/Andrepuel/testtree/bceb00dbaa889b88513dc2d31730807524f4c1d0/mod.ts';

suite('c', (t) => {
    t.suite('primitive int', (t) => {
        const primitive = new c.PrimitiveType('i32');

        t.test('name matches i32', () => {
            assertEquals(primitive.name, 'i32');
        });

        t.test('param name matches C type name', () =>
            assertEquals(primitive.paramname, 'int'),
        );

        t.test('stub is undefined', () => {
            assertEquals(primitive.stub, undefined);
        });
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
        stub: undefined,
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

    t.suite('c class file', (t) => {
        const clss = new CoisaClass();
        const file = new c.ClassFile(clss);

        t.test('is named after the class with .h extension', () => {
            assertEquals(file.name, 'coisa.h');
        });

        t.test('content is the class', () => {
            assertEquals(file.content, [clss]);
        });

        t.suite('and function with deps', (t) => {
            const clss2 = new CoisaClass();
            clss2.name = 'two_t';
            const functionWithDeps = new CoisaFunction([
                { name: 'two', type: clss2 },
            ]);
            clss.methods.push(functionWithDeps);
            t.test('it includes external dependencies on args as stub', () => {
                assertEquals(file.content, [clss2.stub, clss]);
            });

            t.test('it includes external dependencies on ret as stub', () => {
                const clss3 = new CoisaClass();
                clss3.name = 'three_t';
                functionWithDeps.ret = clss3;
                assertEquals(file.content, [clss2.stub, clss3.stub, clss]);
            });

            t.test('it does not repeat types', () => {
                functionWithDeps.args.push({ name: 'other', type: clss });
                functionWithDeps.args.push({ name: 'twoAgain', type: clss2 });
                assertEquals(file.content, [clss2.stub, clss]);
            });
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
        });
    });

    t.suite('struct stub', (t) => {
        const stub = new c.Stub('coisa_t');

        t.test('generates stub code', () => {
            assertEquals(
                codeToString(stub),
                'typedef struct coisa_s coisa_t;\n',
            );
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
            const method = new c.SpecMethod(
                new CoisaClass(),
                staticSpec,
                context,
            );

            t.test('name is snake case', () => {
                assertEquals(method.name, 'coisa_a_method');
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
            const sidesDeinit: ctx.Method = {
                args: [],
                asyncMethod: false,
                name: '_sides_deinit',
                ret: {
                    name: 'void',
                },
                staticMethod: false,
            };

            const classSpec: ctx.Class = {
                name: 'CoisaDeCamelo',
                languages: [],
                methods: [staticSpec, memberSpec],
            };

            const classWithDeinit: ctx.Class = {
                ...classSpec,
                methods: [sidesDeinit].concat(classSpec.methods),
            };

            const vtableSpec: ctx.Interface = {
                name: 'CoisaDeCamelo',
                methods: [sidesDeinit, memberSpec],
            };

            t.suite('the spec based class', (t) => {
                const clss = new c.ClassSpec(classSpec, context);

                t.test('name is camel case', () => {
                    assertEquals(clss.name, 'coisa_de_camelo_t');
                });

                t.test('methods are converted to spec methods', () => {
                    assertEquals(clss.methods, [
                        new c.SpecMethod(clss, staticSpec, context),
                        new c.MemberSpecMethod(clss, memberSpec, context),
                    ]);
                });
            });

            t.suite('the spec based interface', (t) => {
                const interfac = new c.InterfaceSpec(vtableSpec, context);

                t.test('name is camel case followed by t', () => {
                    assertEquals(interfac.name, 'coisa_de_camelo_t');
                });

                t.test('functions are member methods', () => {
                    assertEquals(interfac.methods, [
                        new c.MemberSpecMethod(interfac, sidesDeinit, context),
                        new c.MemberSpecMethod(interfac, memberSpec, context),
                    ]);
                });
            });

            t.suite("the main context's", (t) => {
                const context = new ctx.Context([classSpec]);

                t.test('cType of a class is a c.Class', () => {
                    assertEquals(
                        context.cType('CoisaDeCamelo'),
                        new c.ClassSpec(classWithDeinit, context),
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

    t.suite('function pointer', (t) => {
        const args = [
            {
                name: 'a1',
                type: new CoisaClass(),
            },
        ];
        const underlying = new CoisaFunction(args);
        const functionPointer = new c.FunctionPointer(underlying);

        t.test('has the same name as the underlying function', () => {
            assertEquals(functionPointer.name, 'coisa');
        });

        t.test('has the same args as the underlying function', () => {
            assertEquals(functionPointer.args, args);
        });

        t.test('has the same ret as the underlying function', () => {
            assertEquals(functionPointer.ret, simpleCtype);
        });

        t.test('is async if underlying function is', () => {
            [true, false].forEach((isAsync) => {
                underlying.asyncMethod = isAsync;
                assertEquals(functionPointer.asyncMethod, isAsync);
            });
        });

        t.test('is static if underlying function is', () => {
            [true, false].forEach((isStatic) => {
                underlying.staticMethod = isStatic;
                assertEquals(functionPointer.staticMethod, isStatic);
            });
        });

        t.test('gencode will be function name in the asterisk syntax', () => {
            underlying.args.push({
                name: 'a2',
                type: new c.PrimitiveType('i32'),
            });
            assertEquals(
                functionPointer.genCode(),
                'custom_t* (*coisa)(coisa_t* a1, int a2)',
            );
        });
    });

    class AStruct extends c.Struct {
        constructor(public members: c.NameType[]) {
            super();
        }

        name = 'astruct_t';
    }

    t.suite('struct', (t) => {
        const aStruct = new AStruct([
            {
                name: 'coisa',
                type: new CoisaClass(),
            },
            {
                name: 'primitive',
                type: new c.PrimitiveType('i32'),
            },
        ]);

        t.test('has stub', () => {
            assertEquals(aStruct.stub, new c.Stub('astruct_t'));
        });

        t.test('paramname is name pointer syntax', () => {
            assertEquals(aStruct.paramname, 'astruct_t*');
        });

        t.test('is a list of its members', () => {
            assertEquals(
                codeToString(aStruct),
                'typedef struct astruct_s {\n    coisa_t* coisa;\n    int primitive;\n} astruct_t;\n',
            );
        });

        t.suite('with function pointer member', (t) => {
            const functionPointer = new c.FunctionPointer(new CoisaFunction());
            const aStruct = new AStruct([
                {
                    name: '',
                    type: functionPointer,
                },
            ]);
            t.test('uses the function pointer syntax', () => {
                assertEquals(
                    codeToString(aStruct),
                    'typedef struct astruct_s {\n    custom_t* (*coisa)();\n} astruct_t;\n',
                );
            });
        });
    });

    t.suite('vtable', (t) => {
        const args: c.NameType[] = [
            {
                name: 'a1',
                type: new CoisaClass(),
            },
        ];
        const vtable = new c.Vtable(new CoisaClass(), [
            new CoisaFunction(),
            new CoisaFunction(args),
        ]);

        t.test('name is the name of the self', () => {
            assertEquals(vtable.name, 'coisa_t');
        });

        t.test('members is a function pointer of each method', () => {
            assertEquals(vtable.members, [
                {
                    name: '',
                    type: new c.FunctionPointer(new CoisaFunction()),
                },
                {
                    name: '',
                    type: new c.FunctionPointer(new CoisaFunction(args)),
                },
            ]);
        });
    });

    class CoisaInterface extends c.Interface {
        name = 'coisa_t';
        methods = [new CoisaFunction()];
    }

    t.suite('interface', (t) => {
        const coisa = new CoisaInterface();
        const struct = new c.InterfaceStruct(coisa);

        t.test('struct name is interface name', () => {
            assertEquals(struct.name, 'coisa_t');
        });

        t.test('struct members is a pointer to the vtable', () => {
            assertEquals(struct.members, [
                {
                    name: '_sides_vtable',
                    type: new c.Vtable(coisa, [new CoisaFunction()]),
                },
            ]);
        });

        t.test('paramname is function pointer', () => {
            assertEquals(coisa.paramname, 'coisa_t*');
        });

        t.test('stub is struct stub', () => {
            assertEquals(coisa.stub, new c.Stub('coisa_t'));
        });

        t.test('gencode is vtable and struct', () => {
            assertEquals(coisa.genCode(), [
                new c.Vtable(coisa, [new CoisaFunction()]),
                struct,
            ]);
        });

        t.suite('file', (t) => {
            const file = new c.ClassFile(coisa);

            t.test('contents is interface', () => {
                assertEquals(file.content, [coisa]);
            });
        });
    });
});
