// Symbols
{
    const void_type = {name: 'void'};
}

start = d:(declaration / legacy_setting)* _ { return d; }
declaration = _ name:identifier _ "=" _ t:declaration_value { return {...t, name:name }; }
declaration_value = interface / enum / setting_value
interface = "interface" languages:language* _ "{" methods:method* _ "}" {
    return {
        languages,
        methods,
    };
}
language = _ "+" lang:identifier { return lang; }
method = modifier:modifier _ name:identifier _ "(" args:args _ ")" ret:type? _ ";" {
    return {
        ...modifier,
        args,
        name,
        ret: ret ? ret : void_type,
    };
}
modifier = mods:(_ static_:("static"/"async"))* {
    const hasMod = (mod: string, mods: [undefined, string][]) => mods.some((x) => x[1] == mod);

    return {
        asyncMethod: hasMod('async', mods),
        staticMethod: hasMod('static', mods),
    };
}
args = head:(_ identifier type ("," args)?)? { return head ? [{name: head[1], type: head[2]}].concat(head[3] ? head[3][1] : []) : []; }
type = _ ":" _ name:identifier { return {name} }
enum = "enum" _ "{" values:enum_member* _ "}" { return {values}; }
enum_member = _ value:identifier _ ";" { return value; }
legacy_setting = "#" _ name:identifier _ "=" _ value:setting_value _ "#" { return {...value, name}; }
setting_value = "\"" value:( [^"\\] / "\\" . )* "\"" {
    return {
        value: value.map((c: string|['\\', string]) => c[1] ? c[1] : c).join("")
    };
}

// Lex
identifier = id:([a-zA-Z_][a-zA-Z_0-9]*) { return id[0] + id[1].join(""); }
_ "whitespace" = [ \t\n\r]* { return; }