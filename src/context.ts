import {Parser, Grammar} from 'nearley';
import * as sidesGrammar from './sides_grammar';

const sides = Grammar.fromCompiled(sidesGrammar);

export function parse(input: string): (Class|Enum)[] {
    const parser = new Parser(sides);
    parser.feed(input);
    console.log("OUTPUT " + JSON.stringify(parser.results[0]));
    return parser.results[0];
}

export interface NameType {
    name: string,
    type: Type,
}

export interface Type {
    name: string,
}

export interface Method extends Type {
    static: boolean,
    args: NameType[],
    ret: Type,
}

export interface Class extends Type {
    languages: string[],
    methods: Method[],
    values?: undefined,
}

export interface Enum extends Type {
    languages?: undefined,
    methods?: undefined,
    values: string[],
}