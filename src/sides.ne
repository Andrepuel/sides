@{%
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
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

main -> declaration:+ {% (data) => data[0].map((x) => x[0]) %}
declaration -> class | enum_decl
class -> %identifier %eq %interface (%language:*) %begin (member:*) %end {% (data) => {
    return {
        name: data[0].value,
        languages: data[3][0].map((x) => x.value.substr(1)),
        methods: data[5][0],
    }
}%}
member -> %static:? %identifier %lparen param_list:? %rparen (%typeOp %identifier):? %msep {% (data) => {
    return {
        name: data[1].value,
        static: !!data[0],
        args: data[3] ? data[3] : [],
        ret: {
            name: data[5] ? data[5][1].value : 'void',
        }
    }
}%}
param_list -> %identifier %typeOp %identifier (%psep param_list):? {%  (data) => {
    return [
        {
            name: data[0].value,
            type: {
                name: data[2].value,
            }
        },
    ].concat(data[3] ? data[3][1] : [])
} %}
enum_decl -> %identifier "=" %enum_lex %begin (enum_value:*) %end {% (data) => {
    return {
        name: data[0].value,
        values: data[4][0],
    }
}%}
enum_value -> %identifier %msep {% (data) => data[0].value %}