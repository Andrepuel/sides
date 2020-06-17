import * as sides from '../grammar/sides.ts';

export function parse(input: string): (Class | Enum)[] {
    return sides.parse(input);
}

export interface NameType {
    name: string;
    type: Type;
}

export interface Type {
    name: string;
}

export interface Method extends Type {
    args: NameType[];
    asyncMethod: boolean;
    ret: Type;
    staticMethod: boolean;
}

export interface Class extends Type {
    languages: string[];
    methods: Method[];
    values?: undefined;
}

export interface Enum extends Type {
    languages?: undefined;
    methods?: undefined;
    values: string[];
}

export interface Setting extends Type {
    value: string;
}
