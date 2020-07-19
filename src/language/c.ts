import * as ctx from '../context.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { Node, Code, codeToString } from '../notation.ts';
import { Identifier } from '../identifier.ts';
import { some } from '../assert.ts';

function isDefined<T>(a: T | undefined): a is T {
    return a !== undefined;
}

function distinct<K, T>(index: Set<K>, keyCb: (t: T) => K): (t: T) => boolean {
    return (t) => {
        const key = keyCb(t);
        if (index.has(key)) {
            return false;
        }

        index.add(key);
        return true;
    };
}

function indent(a: Code | Code[]): Node {
    return {
        genCode: () => '    ' + codeToString(a).slice(0, -1),
    };
}

export interface Context {
    cType(name: string): Type | undefined;
}

export interface Type extends ctx.Type {
    paramname: string;
    stub: Stub | undefined;
}

export type Method = ctx.Method<Type> & Node;
export type NameType = ctx.NameType<Type>;

export class PrimitiveType implements Type {
    public constructor(public name: string) {}

    public get paramname(): string {
        if (this.name == 'i8') {
            return 'char';
        } else if (this.name == 'i16') {
            return 'short';
        } else if (this.name == 'i32') {
            return 'int';
        } else if (this.name == 'i64') {
            return 'long long';
        } else if (this.name[0] == 'u') {
            return (
                'unsigned ' +
                new PrimitiveType('i' + this.name.slice(1)).paramname
            );
        } else if (this.name == 'long') {
            return 'long';
        } else if (this.name == 'size') {
            return 'unsigned long';
        } else if (this.name == 'void') {
            return 'void';
        }

        assert(false, 'unknown type ' + this.name);
        return '';
    }

    public get stub(): undefined {
        return;
    }
}

export abstract class Function implements Method {
    abstract get name(): string;
    abstract get args(): NameType[];
    abstract get ret(): Type;
    abstract get asyncMethod(): boolean;
    abstract get staticMethod(): boolean;

    public genCode(): string {
        const args = this.args
            .map((x) => `${x.type.paramname} ${x.name}`)
            .join(', ');
        return `${this.ret.paramname} ${this.name}(${args});`;
    }
}

export class Typedef implements Node {
    constructor(private name: string, private body: undefined | Code[]) {}

    public genCode(): Code | Code[] {
        const structName = Identifier.fromSnake(this.name);
        const underlineT = structName.comps.pop();
        assert(underlineT === 't');
        structName.comps.push('s');

        const typedef = `typedef struct ${structName.toSnake()}`;
        const name = `${this.name};`;

        if (this.body === undefined) {
            return `${typedef} ${name}`;
        } else {
            return [`${typedef} {` as Code]
                .concat(this.body.map(indent))
                .concat(`} ${name}`);
        }
    }
}

export class Stub implements Node {
    constructor(public struct: string) {
        assert(this.struct.endsWith('_t'));
    }

    public genCode(): Node {
        return new Typedef(this.struct, undefined);
    }
}

export abstract class Class implements Type, Node, ctx.Class<Type> {
    abstract get name(): string;
    abstract get methods(): Function[];

    languages = [];

    public get stub(): Stub {
        return new Stub(this.name);
    }

    public genCode(): Node[] {
        return [this.stub as Node].concat(this.methods);
    }

    public get paramname(): string {
        return `${this.name}*`;
    }

    public file(): File {
        return new ClassFile(this);
    }
}

export class PragmaOnce implements Node {
    public genCode(): string {
        return '#pragma once';
    }
}

export abstract class File implements Node {
    abstract get name(): string;
    abstract get content(): Node[];

    public genCode(): Node[] {
        return [new PragmaOnce() as Node].concat(this.content);
    }
}

export class ClassFile extends File {
    constructor(private clss: Class | Interface) {
        super();
    }

    get name(): string {
        const name = this.clss.name;
        assert(name.endsWith('_t'));
        return name.slice(0, -2) + '.h';
    }

    get content(): Node[] {
        const repeated = new Set<string>();
        repeated.add(this.clss.name);

        const typeStubs: Node[] = this.clss.methods
            .map((method) =>
                method.args
                    .map((y) => y.type)
                    .concat([method.ret])
                    .filter(distinct(repeated, (type) => type.name))
                    .map((type) => type.stub)
                    .filter(isDefined),
            )
            .reduce((a, b) => a.concat(b), []);
        return typeStubs.concat([this.clss]);
    }
}

export class SpecMethod extends Function {
    constructor(
        public self: Type,
        public spec: ctx.Method,
        protected ctx: Context,
    ) {
        super();
    }

    get name(): string {
        const name = Identifier.fromSnake(this.self.name);
        assert(name.comps.pop() == 't');
        name.comps = name.comps.concat(
            Identifier.fromCamel(this.spec.name).comps,
        );
        return name.toSnake();
    }
    get args(): NameType[] {
        return this.spec.args.map((a) => ({
            name: a.name,
            type: this.toC(a.type),
        }));
    }
    get ret(): Type {
        return this.toC(this.spec.ret);
    }

    get asyncMethod(): boolean {
        return false;
    }
    get staticMethod(): boolean {
        return true;
    }

    protected toC(type: ctx.Type): Type {
        return some(this.ctx.cType(type.name));
    }
}

export class MemberSpecMethod extends SpecMethod {
    constructor(self: Type, spec: ctx.Method, ctx: Context) {
        super(self, spec, ctx);
    }

    get args(): NameType[] {
        return [
            {
                name: '_sides_self',
                type: this.self,
            },
        ].concat(super.args);
    }

    get staticMethod(): boolean {
        return false;
    }
}

class SpecBased {
    constructor(protected spec: ctx.Element) {}

    get name(): string {
        const id = Identifier.fromCamel(this.spec.name);
        id.comps.push('t');
        return id.toSnake();
    }
}

export class ClassSpec extends Class {
    constructor(private spec: ctx.Class, private ctx: Context) {
        super();
    }

    get name(): string {
        return new SpecBased(this.spec).name;
    }

    get methods(): Function[] {
        return this.spec.methods.map((spec) =>
            spec.staticMethod
                ? new SpecMethod(this, spec, this.ctx)
                : new MemberSpecMethod(this, spec, this.ctx),
        );
    }
}

export class FunctionPointer implements Method, Type {
    stub = undefined;
    paramname = '';

    constructor(private method: Method) {}

    get name(): string {
        return this.method.name;
    }
    get args(): NameType[] {
        return this.method.args;
    }
    get ret(): Type {
        return this.method.ret;
    }
    get asyncMethod(): boolean {
        return this.method.asyncMethod;
    }
    get staticMethod(): boolean {
        return this.method.staticMethod;
    }

    genCode(): string {
        const args = this.args
            .map((arg) => `${arg.type.paramname} ${arg.name}`)
            .join(', ');
        return `${this.ret.paramname} (*${this.name})(${args})`;
    }
}

class StructMember implements Node {
    constructor(private nameType: NameType) {}

    genCode(): string {
        if (this.nameType.type instanceof FunctionPointer) {
            return `${this.nameType.type.genCode()};`;
        }
        return `${this.nameType.type.paramname} ${this.nameType.name};`;
    }
}

export abstract class Struct implements Type, Node {
    abstract get name(): string;
    abstract get members(): NameType[];

    get paramname(): string {
        return `${this.name}*`;
    }

    get stub(): Stub {
        return new Stub(this.name);
    }

    genCode(): Code {
        return new Typedef(
            this.name,
            this.members.map((m) => new StructMember(m)),
        );
    }
}

export class InterfaceStruct extends Struct {
    constructor(private self: Interface) {
        super();
    }

    get name(): string {
        return this.self.name;
    }
    get members(): NameType[] {
        return [
            {
                name: new Identifier(['_sides', 'vtable']).toSnake(),
                type: new Vtable(this.self, this.self.methods),
            },
        ];
    }
}

export abstract class Interface implements Type, Node, ctx.Interface<Type> {
    private struct = new InterfaceStruct(this);

    abstract get name(): string;
    abstract get methods(): Function[];

    get stub(): Stub {
        return this.struct.stub;
    }

    get paramname(): string {
        return this.struct.paramname;
    }

    genCode(): Node[] {
        return [new Vtable(this, this.methods), new InterfaceStruct(this)];
    }
}

export class Vtable extends Struct {
    constructor(private self: Type, private methods: Function[]) {
        super();
    }

    get name(): string {
        return this.self.name;
    }

    get members(): NameType[] {
        return this.methods.map((method) => ({
            name: '',
            type: new FunctionPointer(method),
        }));
    }
}

export class InterfaceSpec extends Interface {
    constructor(private spec: ctx.Interface, private context: Context) {
        super();
    }

    get name(): string {
        return new SpecBased(this.spec).name;
    }

    get methods(): Function[] {
        return this.spec.methods.map(
            (spec) => new MemberSpecMethod(this, spec, this.context),
        );
    }
}
