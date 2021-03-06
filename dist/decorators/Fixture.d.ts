/// <reference types="faker" />
export declare type FixtureOptions = string | ((faker?: Faker.FakerStatic) => string | undefined) | (() => any) | {
    type?: () => object;
    ignore?: boolean;
    enum?: object;
    min?: number;
    max?: number;
    get?: ((faker?: Faker.FakerStatic) => string | undefined) | (() => any);
    optional?: boolean;
};
/**
 * Decorator for providing metadata about a property
 * or for customizing the generate fixture
 * @param options
 */
export declare function Fixture(options?: FixtureOptions): import("tinspector").PropertyDecorator;
//# sourceMappingURL=Fixture.d.ts.map