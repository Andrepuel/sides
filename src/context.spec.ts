import * as assert from 'assert';
import {expect} from 'chai';
import { parse, Class, Method, Enum } from './context';

function makeMethod(declaration: string): Method {
    const aClass = parse(`Placeholder = interface { ${declaration} }`)[0];
    if (aClass.methods === undefined) {
        assert(false);
        return null as any;
    }

    return aClass.methods[0];
}


describe('parser', () => {
    it('class', () => {
        expect(parse("Use = interface {}")[0].name).to.be.deep.equal("Use");
        expect(parse("Use = interface +o +c {}")[0].languages).to.be.deep.equal(["o", "c"]);
        expect(parse("Use = interface {}")[0].methods).to.be.deep.equal([
        ]);
        const bola: Method = {
            name: 'bola',
            static: false,
            args: [],
            ret: {
                name: 'void',
            }
        }
        expect(parse("Use = interface { bola(); }")[0].methods).to.be.deep.equal([
            bola,
        ]);
    });

    it('enum', () => {
        const types = parse("e = enum { bola; } f = interface +o { } outro = interface { } mais_enum = enum {} ");
        const anEnum: Enum = {
            name: 'e',
            values: ['bola'],
        }
        expect(types[0]).to.be.deep.equal(anEnum);

        const anClass: Class = {
            name: 'f',
            languages: ['o'],
            methods: [],
        }
        console.log(types);
        expect(types[1]).to.be.deep.equal(anClass);
    });

    it('method', () => {
        const bola: Method = {
            name: 'bola',
            args: [],
            static: false,
            ret: {
                name: 'void',
            }
        };
        expect(makeMethod('bola();')).to.be.deep.equal(bola);

        const staticBola: Method = {
            name: 'bola',
            args: [],
            static: true,
            ret: {
                name: 'void',
            }
        };

        expect(makeMethod('static bola();')).to.be.deep.equal(staticBola);

        const bolaRet: Method = {
            name: 'bola',
            static: false,
            args: [],
            ret: {
                name: 'i8',
            }
        };

        expect(makeMethod('bola(): i8;')).to.be.deep.equal(bolaRet);

        const bolaArgs: Method = {
            name: 'bola',
            static: false,
            args: [
                {
                    name: 'a',
                    type: {
                        name: 'i8',
                    }
                },
                {
                    name: 'b',
                    type: {
                        name: 'i16',
                    }
                }
            ],
            ret: {
                name: 'void',
            }
        }

        expect(makeMethod('bola(a: i8, b:i16);')).to.be.deep.equal(bolaArgs);
        //     assert _make_method("bola(a: i8, b:i16);").args[0][1].name == "i8"
        //     assert _make_method("bola(a: i8, b:i16);").args[1][0] == "b"
        //     assert _make_method("bola(a: i8, b:i16);").args[1][1].name == "i16"
        //     assert not _make_method("bola();").async_
        //     assert _make_method("async coisa();").async_
        //     assert not _make_method("async coisa();").static
        //     assert _make_method("static async coisa();").static
        //     assert _make_method("static async coisa();").async_

    });
});


// def test_type():
//     assert Type.fromTree(parse("i8", "type")).name == "i8"
//     assert Type.fromTree(parse("list<i8>", "type")).name == "list:i8"

// def test_settings():
//     ctx = Context(parse('# ola = "valor" # # dois = "out\\"ro" #'))
//     assert ctx.setting('ola') == 'valor'
//     assert ctx.setting('dois') == 'out"ro'
//     assert ctx.setting('default') == ''

// def test_list_of_list_will_force_instantiation_of_inner_list():
//     ctx = Context.fromStr('''ola = interface { a(): list<list<i32>>; }''')
//     assert ctx.getAll('list:i32').name == 'list:i32'