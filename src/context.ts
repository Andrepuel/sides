import * as sides from '../grammar/sides.ts';
import * as c from './language/c.ts';

export type Element = Class | Enum | Setting;

export function parse(input: string): Element[] {
    return sides.parse(input);
}

export interface NameType<T = Type> {
    name: string;
    type: T;
}

export interface Type {
    name: string;
}

export interface Method<T = Type> extends Type {
    args: NameType<T>[];
    asyncMethod: boolean;
    ret: T;
    staticMethod: boolean;
}

export interface Class<T = Type> extends Type {
    languages: string[];
    methods: Method<T>[];
    values?: undefined;
}

export interface Enum extends Type {
    languages?: undefined;
    methods?: undefined;
    values: string[];
}

export interface Setting extends Type {
    value: string;
    methods?: undefined;
}

export class Context implements c.Context {
    private primitives = [
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
    ];

    public constructor(private elements: Element[]) {}

    public cType(name: string): c.Type | undefined {
        if (this.primitives.find((x) => x === name)) {
            return new c.PrimitiveType(name);
        }

        const element = this.element(name);
        if (element?.methods) {
            return new c.ClassSpec(element, this);
        }

        return;
    }

    private element(name: string): Element | undefined {
        return this.elements.find((x) => x.name == name);
    }
}
