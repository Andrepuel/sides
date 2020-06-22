import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { assertEquals } from '../assert.ts';
import * as c from './c.ts';
import * as ctx from '../context.ts';
import { Node } from '../notation.ts';

Deno.test('primitive int', () => {
    const integer = new c.PrimitiveType('i32');
    assertEquals(integer.name, 'i32');
    assertEquals(integer.paramname, 'int');
});

Deno.test('retname table', () => {
    for (let [name, paramname] of [
        ['i8', 'char'],
        ['i16', 'short'],
        ['i32', 'int'],
        ['i64', 'long long'],
        ['long', 'long'],
        ['u8', 'unsigned char'],
        ['u16', 'unsigned short'],
        ['u32', 'unsigned int'],
        ['u64', 'unsigned long long'],
        ['size', 'unsigned long'],
        ['void', 'void'],
    ]) {
        assertEquals(new c.PrimitiveType(name).paramname, paramname);
    }
});

const simple_ctype: c.Type = {
    name: 'custom',
    paramname: 'custom_t*',
};

class CoisaFunction extends c.Function {
    constructor(public args: c.NameType[] = []) {
        super();
    }

    name: string = 'coisa';
    ret: c.Type = simple_ctype;
    asyncMethod: boolean = false;
    staticMethod: boolean = false;
}

Deno.test('c function', () => {
    assertEquals(new CoisaFunction().genCode(), 'custom_t* coisa();');
});

Deno.test('c function with args', () => {
    const args = [
        { name: 'a1', type: simple_ctype },
        { name: 'a2', type: simple_ctype },
    ];
    assertEquals(
        new CoisaFunction(args).genCode(),
        'custom_t* coisa(custom_t* a1, custom_t* a2);',
    );
});

Deno.test('struct stub', () => {
    assertEquals(
        new c.Stub('coisa_t').genCode(),
        'typedef struct coisa_s coisa_t;',
    );
});

class CoisaClass extends c.Class {
    constructor(public methods: c.Function[] = []) {
        super();
    }

    get name(): string {
        return 'coisa_t';
    }
}

Deno.test('class type stub', () => {
    assertEquals(new CoisaClass().stub, new c.Stub('coisa_t'));
});

Deno.test('c class code is the stub followed by the functions', () => {
    const c_function = new CoisaFunction();
    const c_class = new CoisaClass([c_function]);
    assertEquals(c_class.genCode(), [c_class.stub, c_function]);
});

Deno.test('c class param name is pointer', () => {
    assertEquals(new CoisaClass().paramname, 'coisa_t*');
});

Deno.test('pragma once', () => {
    assertEquals(new c.PragmaOnce().genCode(), '#pragma once');
});

Deno.test('c file', () => {
    const clss = new CoisaClass();
    const file = new (class extends c.File {
        get name(): string {
            return 'name';
        }
        get content(): Node[] {
            return [clss];
        }
    })();
    assertEquals(file.genCode(), [new c.PragmaOnce() as Node].concat([clss]));
});

Deno.test('file for a class', () => {
    const clss = new CoisaClass();
    assertEquals(clss.file().name, 'coisa.h');
    assertEquals(clss.file().content, [clss]);
});

class CContext implements c.Context {
    types: { [name: string]: c.Type | undefined } = {
        Coisa: new CoisaClass(),
        Custom: simple_ctype,
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

function givenAMethodSpec(then: string, cb: (method: c.SpecMethod) => void) {
    Deno.test('given a method spec then ' + then, () => {
        cb(new c.SpecMethod(staticSpec, new CContext()));
    });
}

givenAMethodSpec('its name is snake case', (method) => {
    assertEquals(method.name, 'a_method');
});

givenAMethodSpec('its args are converted to c types', (method) => {
    assertEquals(method.args, [
        {
            name: 'a1',
            type: simple_ctype,
        },
    ]);
});

givenAMethodSpec('its ret is converted to c types', (method) => {
    assertEquals(method.ret, new c.PrimitiveType('void'));
});

givenAMethodSpec('it is not async', (method) => {
    assertEquals(method.asyncMethod, false);
});

givenAMethodSpec('it is static', (method) => {
    assertEquals(method.staticMethod, true);
});

const memberSpec: ctx.Method = {
    name: 'aMethod',
    args: [
        {
            name: 'a1',
            type: { name: 'Custom' },
        },
    ],
    ret: { name: 'void' },
    staticMethod: false,
    asyncMethod: false,
};

Deno.test('member method receives self as first parameter', () => {
    const method = new c.MemberSpecMethod(
        new CoisaClass(),
        memberSpec,
        new CContext(),
    );
    assertEquals(method.args, [
        {
            name: '_sides_self',
            type: new CoisaClass(),
        },
        {
            name: 'a1',
            type: simple_ctype,
        },
    ]);

    assertEquals(method.staticMethod, false);
});

const classSpec: ctx.Class = {
    name: 'CoisaDeCamelo',
    languages: [],
    methods: [staticSpec, memberSpec],
};

function givenAClassSpec(
    then: string,
    cb: (clss: c.ClassSpec, ctx: CContext) => void,
) {
    Deno.test('given a class then ' + then, () => {
        const ctx = new CContext();
        cb(new c.ClassSpec(classSpec, ctx), ctx);
    });
}

givenAClassSpec('its name is camel case', (clss) => {
    assertEquals(clss.name, 'coisa_de_camelo_t');
});

givenAClassSpec('its methods are converted to spec methods', (clss, ctx) => {
    assertEquals(clss.methods, [
        new c.SpecMethod(staticSpec, ctx),
        new c.MemberSpecMethod(clss, memberSpec, ctx),
    ]);
});

function givenAContext(then: string, cb: (ctx: c.Context) => void) {
    Deno.test('given a context then ' + then, () => {
        cb(new ctx.Context([classSpec]));
    });
}

givenAContext('a class is a c class', (context) => {
    assertEquals(
        context.cType('CoisaDeCamelo'),
        new c.ClassSpec(classSpec, context),
    );
});

givenAContext('primitive types are primitive', (context) => {
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
});

givenAContext('anything else is undefined', (context) => {
    assertEquals(context.cType('inexistent'), undefined);
});
