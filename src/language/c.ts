import * as ctx from '../context.ts';
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { Node } from '../notation.ts';
import { Identifier } from '../identifier.ts';
import { some } from '../assert.ts';

export interface Context {
    cType(name: string): Type | undefined;
}

export interface Type extends ctx.Type {
    paramname: string;
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

export class Stub implements Node {
    constructor(public struct: string) {
        assert(this.struct.endsWith('_t'));
    }

    public genCode(): string {
        return `typedef struct ${this.struct.slice(
            0,
            this.struct.length - 2,
        )}_s ${this.struct};`;
    }
}

export abstract class Class implements Type, Node {
    abstract get name(): string;
    abstract get methods(): Function[];

    public get stub(): Stub | undefined {
        return new Stub(this.name);
    }

    public genCode(): Node[] {
        const stub: Node | undefined = this.stub;
        assert(stub);

        return [stub].concat(this.methods);
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
    constructor(private clss: Class) {
        super();
    }

    get name(): string {
        const name = this.clss.name;
        assert(name.endsWith('_t'));
        return name.slice(0, -2) + '.h';
    }

    get content(): Node[] {
        return [this.clss];
    }
}

export class SpecMethod extends Function {
    constructor(public self: Type, public spec: ctx.Method, protected ctx: Context) {
        super();
    }

    get name(): string {
        const name = Identifier.fromSnake(this.self.name);
        assert(name.comps.pop() == 't');
        name.comps = name.comps.concat(Identifier.fromCamel(this.spec.name).comps);
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

export class ClassSpec extends Class {
    constructor(private spec: ctx.Class, private ctx: Context) {
        super();
    }

    get name(): string {
        const id = Identifier.fromCamel(this.spec.name);
        id.comps.push('t');
        return id.toSnake();
    }

    get methods(): Function[] {
        return this.spec.methods.map((spec) =>
            spec.staticMethod
                ? new SpecMethod(this, spec, this.ctx)
                : new MemberSpecMethod(this, spec, this.ctx),
        );
    }
}
