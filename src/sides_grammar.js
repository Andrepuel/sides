// Generated automatically by nearley, version 2.19.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");

const lexer = moo.compile({
    ws:     /[ \t]+/,
    language: /\+[a-z]/,
    static: "static",
    interface: "interface",
    enum_lex: "enum",
    identifier: /[a-zA-Z_][a-zA-Z_0-9]*/,
    typeOp: ":",
    eq: "=",
    begin: "{",
    end: "}",
    lparen: "(",
    rparen: ")",
    msep: ";",
    psep: ",",
});

const next = lexer.next;
lexer.next = () => {
    const r = next.apply(lexer, []);
    if (r && r.type === "ws") return lexer.next();
    return r;
};

function no_ws(x) {
    return x.filter((x) => x && x.type !== "ws");
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main$ebnf$1", "symbols": ["declaration"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "declaration"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main", "symbols": ["main$ebnf$1"], "postprocess": (data) => data[0].map((x) => x[0])},
    {"name": "declaration", "symbols": ["class"]},
    {"name": "declaration", "symbols": ["enum_decl"]},
    {"name": "class$subexpression$1$ebnf$1", "symbols": []},
    {"name": "class$subexpression$1$ebnf$1", "symbols": ["class$subexpression$1$ebnf$1", (lexer.has("language") ? {type: "language"} : language)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "class$subexpression$1", "symbols": ["class$subexpression$1$ebnf$1"]},
    {"name": "class$subexpression$2$ebnf$1", "symbols": []},
    {"name": "class$subexpression$2$ebnf$1", "symbols": ["class$subexpression$2$ebnf$1", "member"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "class$subexpression$2", "symbols": ["class$subexpression$2$ebnf$1"]},
    {"name": "class", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("eq") ? {type: "eq"} : eq), (lexer.has("interface") ? {type: "interface"} : interface), "class$subexpression$1", (lexer.has("begin") ? {type: "begin"} : begin), "class$subexpression$2", (lexer.has("end") ? {type: "end"} : end)], "postprocess":  (data) => {
            return {
                name: data[0].value,
                languages: data[3][0].map((x) => x.value.substr(1)),
                methods: data[5][0],
            }
        }},
    {"name": "member$ebnf$1", "symbols": [(lexer.has("static") ? {type: "static"} : static)], "postprocess": id},
    {"name": "member$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "member$ebnf$2", "symbols": ["param_list"], "postprocess": id},
    {"name": "member$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "member$ebnf$3$subexpression$1", "symbols": [(lexer.has("typeOp") ? {type: "typeOp"} : typeOp), (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "member$ebnf$3", "symbols": ["member$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "member$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "member", "symbols": ["member$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("lparen") ? {type: "lparen"} : lparen), "member$ebnf$2", (lexer.has("rparen") ? {type: "rparen"} : rparen), "member$ebnf$3", (lexer.has("msep") ? {type: "msep"} : msep)], "postprocess":  (data) => {
            return {
                name: data[1].value,
                static: !!data[0],
                args: data[3] ? data[3] : [],
                ret: {
                    name: data[5] ? data[5][1].value : 'void',
                }
            }
        }},
    {"name": "param_list$ebnf$1$subexpression$1", "symbols": [(lexer.has("psep") ? {type: "psep"} : psep), "param_list"]},
    {"name": "param_list$ebnf$1", "symbols": ["param_list$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "param_list$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "param_list", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("typeOp") ? {type: "typeOp"} : typeOp), (lexer.has("identifier") ? {type: "identifier"} : identifier), "param_list$ebnf$1"], "postprocess":   (data) => {
            return [
                {
                    name: data[0].value,
                    type: {
                        name: data[2].value,
                    }
                },
            ].concat(data[3] ? data[3][1] : [])
        } },
    {"name": "enum_decl$subexpression$1$ebnf$1", "symbols": []},
    {"name": "enum_decl$subexpression$1$ebnf$1", "symbols": ["enum_decl$subexpression$1$ebnf$1", "enum_value"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "enum_decl$subexpression$1", "symbols": ["enum_decl$subexpression$1$ebnf$1"]},
    {"name": "enum_decl", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), {"literal":"="}, (lexer.has("enum_lex") ? {type: "enum_lex"} : enum_lex), (lexer.has("begin") ? {type: "begin"} : begin), "enum_decl$subexpression$1", (lexer.has("end") ? {type: "end"} : end)], "postprocess":  (data) => {
            return {
                name: data[0].value,
                values: data[4][0],
            }
        }},
    {"name": "enum_value", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("msep") ? {type: "msep"} : msep)], "postprocess": (data) => data[0].value}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
