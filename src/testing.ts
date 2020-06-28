import { assertEquals } from './assert.ts';

export function suite(name: string, then: (s: Suite) => void) {
    then(new Suite(name));
}

function catName(...a: string[]): string {
    return a.filter((x) => x).join(' ');
}

function joinTypes<T, U>(t: T, u: U): T & U {
    if (!t) {
        // deno-lint-ignore no-explicit-any
        return u as any;
    }
    if (!u) {
        // deno-lint-ignore no-explicit-any
        return t as any;
    }

    return { ...t, ...u };
}

function noop() {}

type GivenSpec<T, P> = (parent: P) => Promise<T> | T;

export class Suite {
    constructor(public name: string) {}

    public params<Input>(): GivenParam<unknown, Input, unknown> {
        return new GivenParam<unknown, Input, unknown>(this, '', noop, noop);
    }

    public given<T>(
        name: string,
        given: GivenSpec<T, unknown>,
    ): Given<T, unknown> {
        return new Given<T, unknown>(this, name, given, noop);
    }

    public it(name: string, then: () => Promise<void> | void): Suite {
        Deno.test(catName(`${this.name}:`, name), then);
        return this;
    }
}

type Parent<T> = () => Promise<T> | T;
type Params<T, P> = T | ((p: P) => Promise<T> | T);

export class GivenParam<T, Input, P> {
    constructor(
        public suite: Suite,
        private name: string,
        private onGiven: GivenSpec<T, Input & P>,
        private parent: Parent<P>,
    ) {}

    public given<T2>(
        name: string,
        given: GivenSpec<T2, Input & T & P>,
    ): GivenParam<T & T2, Input, P> {
        return new GivenParam<T & T2, Input, P>(
            this.suite,
            catName(this.name, name),
            async (input) => {
                const previous = await this.onGiven(input);
                const value = await given(joinTypes(previous, input));
                return joinTypes(previous, value);
            },
            this.parent,
        );
    }

    public params<Input2>(): GivenParam<T, Input & Input2, P> {
        return new GivenParam<T, Input & Input2, P>(
            this.suite,
            this.name,
            this.onGiven,
            this.parent,
        );
    }

    public with(
        params: Params<Input, P>,
        then: (cb: Given<T, Input & P>) => void,
    ): GivenParam<T, Input, P> {
        then(
            new Given(this.suite, this.name, this.onGiven, async () => {
                const parent = await this.parent();
                let value;
                if (typeof params === 'function') {
                    value = await (params as (p: P) => Promise<Input> | Input)(
                        parent,
                    );
                } else {
                    value = params;
                }
                return joinTypes(parent, value);
            }),
        );

        return this;
    }

    public equals(
        name: string,
        params: Params<Input, P>,
        expected: T,
    ): GivenParam<T, Input, P> {
        return this.with(params, (g) =>
            g.it(name, (actual) => {
                assertEquals(actual, expected);
            }),
        );
    }
}

export class Given<T, P> {
    constructor(
        public suite: Suite,
        private name: string,
        private onGiven: GivenSpec<T, P>,
        private parent: Parent<P>,
    ) {}

    public given<T2>(
        name: string,
        given: GivenSpec<T2, T & P>,
    ): Given<T2, T & P> {
        return new Given(
            this.suite,
            catName(this.name, name),
            given,
            async () => {
                const parent = await this.parent();
                const value = await this.onGiven(parent);
                return joinTypes(parent, value);
            },
        );
    }

    public params<Input>(): GivenParam<unknown, Input, T & P> {
        return new GivenParam<unknown, Input, T & P>(
            this.suite,
            this.name,
            this.onGiven,
            async () => {
                const parent = await this.parent();
                const value = await this.onGiven(parent);
                return joinTypes(parent, value);
            },
        );
    }

    public it(name: string, then: (g: T) => Promise<void> | void): Given<T, P> {
        this.suite.it(catName(this.name, name), async () => {
            const parent = await this.parent();
            const given = await this.onGiven(parent);
            await then(given);
        });
        return this;
    }
}
