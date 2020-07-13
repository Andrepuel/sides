export class Identifier {
    constructor(public comps: string[]) {}

    public static fromCamel(camel: string): Identifier {
        let comps: string[] = [];
        while (camel.length > 0) {
            let pos = camel.slice(1).search('[A-Z]');
            let found;

            if (pos >= 0) {
                found = camel.slice(0, pos + 1);
                camel = camel.slice(pos + 1);
            } else {
                found = camel;
                camel = '';
            }

            comps.push(found.toLowerCase());
        }
        return new Identifier(comps);
    }

    public static fromSnake(snake: string): Identifier {
        return new Identifier(snake.split('_'));
    }

    public toSnake(): string {
        return this.comps.join('_');
    }
}
