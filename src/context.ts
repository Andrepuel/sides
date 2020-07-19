import * as sides from '../grammar/sides.ts';
import * as c from './language/c.ts';

export class StaticMethodIntoClass extends Error {
    public constructor(
        public readonly name: string,
        public readonly method: string,
    ) {
        super(`Interfaces may not have static method (${name}::${method})`);
    }
}

export type Element = Class | Interface | Enum | Setting;

export function parse(input: string): Element[] {
    const r: Element[] = sides.parse(input);
    r.forEach((element) => {
        if (element.methods && element.languages === undefined) {
            const interfac: Interface = element;
            interfac.methods.forEach((method) => {
                if (method.staticMethod) {
                    throw new StaticMethodIntoClass(interfac.name, method.name);
                }
            });
        }
    });
    return r;
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

export interface Interface<T = Type> extends Type {
    languages?: undefined;
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
    private elements: Element[];
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

    public constructor(elements: Element[]) {
        const deinit: Method = {
            args: [],
            asyncMethod: false,
            name: '_sides_deinit',
            ret: {
                name: 'void',
            },
            staticMethod: false,
        };
        this.elements = elements.map((x) => {
            if (x.methods) {
                return {
                    ...x,
                    methods: [deinit].concat(x.methods),
                };
            } else {
                return x;
            }
        });
    }

    public cType(name: string): c.Type | undefined {
        if (this.primitives.find((x) => x === name)) {
            return new c.PrimitiveType(name);
        }

        const element = this.element(name);
        if (element?.methods) {
            if (element?.languages) {
                return new c.ClassSpec(element, this);
            } else {
                return new c.InterfaceSpec(element, this);
            }
        }

        return;
    }

    private element(name: string): Element | undefined {
        return this.elements.find((x) => x.name == name);
    }
}
