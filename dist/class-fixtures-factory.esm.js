import reflect, { decorateProperty } from 'tinspector';
import { __assign, __read, __extends, __values, __spread } from 'tslib';
import { getFromContainer, MetadataStorage } from 'class-validator';
import faker from 'faker';
import chalk from 'chalk';
import treeify from 'treeify';

/**
 * Get possible values from an enum
 * @param enumObj
 */
var getEnumValues = function (enumObj) {
    var keysList = Object.getOwnPropertyNames(enumObj).filter(function (key) {
        // eslint-disable-next-line no-prototype-builtins
        return enumObj.propertyIsEnumerable(key) && key !== String(parseFloat(key));
    });
    var length = keysList.length;
    var valuesList = new Array(length);
    for (var index = 0; index < length; ++index) {
        var key = keysList[index];
        var value = enumObj[key];
        valuesList[index] = value;
    }
    return valuesList;
};

/**
 * Decorator for providing metadata about a property
 * or for customizing the generate fixture
 * @param options
 */
function Fixture(options) {
    return decorateProperty({
        type: 'Fixture',
        value: options,
    });
}

var BaseMetadataStore = /** @class */ (function () {
    function BaseMetadataStore() {
        this.store = {};
    }
    BaseMetadataStore.prototype.get = function (classType) {
        var name = typeof classType === 'string' ? classType : classType.name;
        var value = this.store[name];
        if (!value)
            throw new Error("Cannot find metadata for class \"" + name + "\"");
        return value;
    };
    return BaseMetadataStore;
}());

var ClassValidatorAdapter = /** @class */ (function () {
    function ClassValidatorAdapter() {
        this.metadata = {};
    }
    ClassValidatorAdapter.prototype.extractMedatada = function (classType) {
        var metadata = getFromContainer(MetadataStorage).getTargetValidationMetadatas(classType, '');
        return (this.metadata[classType.name] = metadata);
    };
    ClassValidatorAdapter.prototype.makePropertyMetadata = function (cvMeta, existingProp) {
        var prop = __assign({ name: cvMeta.propertyName }, (existingProp || {}));
        var data = {
            type: null,
            max: null,
            min: null,
        };
        switch (cvMeta.type) {
            case 'isBoolean': {
                return __assign(__assign({}, prop), { type: prop.type || 'boolean', input: function () { return faker.random.boolean(); } });
            }
            case 'isDate': {
                data.type = 'date';
                break;
            }
            case 'isString': {
                data.type = 'alpha';
                break;
            }
            case 'isNumber':
            case 'isInt':
            case 'isNumberString': {
                data.type = 'number';
                break;
            }
            case 'isIn': {
                var items_1 = cvMeta.constraints[0];
                return __assign(__assign({}, prop), { type: prop.type || 'any', input: function () { return faker.random.arrayElement(items_1); } });
            }
            case 'equals':
                return __assign(__assign({}, prop), { type: prop.type || 'any', input: function () { return cvMeta.constraints[0]; } });
            case 'isEmpty':
                return __assign(__assign({}, prop), { type: prop.type || 'any', input: function () { return null; } });
            case 'isPositive':
                data.type = 'number';
                data.min = 1;
                break;
            case 'isNegative':
                data.type = 'number';
                data.max = -1;
                break;
            case 'min': {
                var value = cvMeta.constraints[0];
                data.type = 'number';
                data.min = value;
                break;
            }
            case 'max': {
                var value = cvMeta.constraints[0];
                data.type = 'number';
                data.max = value;
                break;
            }
            case 'minDate': {
                var value = cvMeta.constraints[0];
                data.type = 'date';
                data.min = value;
                break;
            }
            case 'maxDate': {
                var value = cvMeta.constraints[0];
                data.type = 'date';
                data.max = value;
                break;
            }
            case 'contains': {
                var value_1 = cvMeta.constraints[0];
                return __assign(__assign({}, prop), { type: prop.type || 'any', input: function () { return "" + faker.random.word() + value_1 + faker.random.word(); } });
            }
            case 'isAlpha':
                data.type = 'alpha';
                break;
            case 'isAlphanumeric':
                data.type = 'alphanumeric';
                break;
            case 'isDecimal':
                data.options = cvMeta.constraints[0];
                data.type = 'decimal';
                break;
            case 'isEmail':
                return __assign(__assign({}, prop), { type: 'string', input: function () { return faker.internet.email(); } });
            case 'isFqdn':
                return __assign(__assign({}, prop), { type: 'string', input: function () { return faker.internet.domainName(); } });
            case 'isHexColor':
                return __assign(__assign({}, prop), { type: 'string', input: function () { return faker.internet.color(); } });
            case 'isLowercase':
                data.type = 'alpha';
                data["case"] = 'lower';
                break;
            case 'isUppercase':
                data.type = 'alpha';
                data["case"] = 'upper';
                break;
            case 'length': {
                var _a = __read(cvMeta.constraints, 2), min = _a[0], max = _a[1];
                data.min = min;
                data.max = max || 6;
                data.type = 'alpha';
                break;
            }
            case 'minLength': {
                var value = cvMeta.constraints[0];
                data.min = value;
                data.type = 'alpha';
                break;
            }
            case 'maxLength': {
                var value = cvMeta.constraints[0];
                data.max = value;
                data.type = 'alpha';
                break;
            }
            case 'arrayContains': {
                var value_2 = cvMeta.constraints[0];
                return __assign(__assign({}, prop), { type: 'string', input: function () { return value_2; } });
            }
            case 'arrayMinSize': {
                var value = cvMeta.constraints[0];
                data.type = 'array';
                data.min = value;
                break;
            }
            case 'arrayMaxSize': {
                var value = cvMeta.constraints[0];
                data.type = 'array';
                data.max = value;
                break;
            }
        }
        if (typeof data.max === 'number' && !data.min) {
            data.min = data.max - 1;
        }
        else if (typeof data.min === 'number' && !data.max) {
            data.max = data.min + 1;
        }
        if (typeof data.max === 'number' &&
            typeof data.min === 'number' &&
            data.min > data.max) {
            data.max = data.min + 1;
        }
        switch (data.type) {
            case 'number': {
                var min = data.min;
                var max = data.max;
                var sign = max < 0 ? -1 : 1;
                var value_3 = sign *
                    faker.random.number({
                        min: Math.abs(min || sign),
                        max: Math.abs(max || 10000),
                    });
                return __assign(__assign({}, prop), { type: 'number', input: function () { return value_3; } });
            }
            case 'decimal': {
                var min = data.min;
                var max = data.max;
                var digits = Number(data.options.decimal_digits || '1');
                var sign = max < 0 ? -1 : 1;
                var value_4 = sign *
                    parseFloat(faker.finance.amount(Math.abs(min || sign), Math.abs(max || 10000), digits));
                return __assign(__assign({}, prop), { type: 'number', input: function () { return value_4; } });
            }
            case 'date': {
                var min = data.min;
                var max = data.max;
                var value_5;
                if (min) {
                    value_5 = faker.date.between(min, max || faker.date.future(1, min));
                }
                else if (max) {
                    value_5 = faker.date.between(min || faker.date.past(1, max), max);
                }
                else {
                    value_5 = faker.date.recent();
                }
                return __assign(__assign({}, prop), { type: 'Date', input: function () { return value_5; } });
            }
            case 'alpha': {
                var min = data.min;
                var max = data.max;
                var ln = faker.random.number({ min: min || 5, max: max || 10 });
                var value_6 = faker.lorem
                    .sentence(100)
                    .substr(0, ln)[data["case"] === 'lower' ? 'toLowerCase' : 'toUpperCase']();
                return __assign(__assign({}, prop), { type: 'string', input: function () { return value_6; } });
            }
            case 'alphanumeric': {
                var min = data.min;
                var max = data.max;
                var ln_1 = faker.random.number({ min: min || 5, max: max || 10 });
                return __assign(__assign({}, prop), { type: 'string', input: function () {
                        return faker.random
                            .alphaNumeric(ln_1)[data["case"] === 'lower' ? 'toLowerCase' : 'toUpperCase']();
                    } });
            }
            case 'array': {
                if (!prop.type) {
                    throw new Error("The type of \"" + cvMeta.propertyName + "\" seems to be an array. Use @Fixture({ type: () => Foo })");
                }
                return __assign(__assign({}, prop), { max: data.max || prop.max, min: data.min || prop.min });
            }
        }
        if (!prop.type) {
            throw new Error("Couldn't extract the type of \"" + cvMeta.propertyName + "\". Use @Fixture({ type: () => Foo })");
        }
        return prop;
    };
    return ClassValidatorAdapter;
}());

var DefaultMetadataStore = /** @class */ (function (_super) {
    __extends(DefaultMetadataStore, _super);
    function DefaultMetadataStore(acceptPartialResult) {
        if (acceptPartialResult === void 0) { acceptPartialResult = false; }
        var _this = _super.call(this) || this;
        _this.acceptPartialResult = acceptPartialResult;
        _this.cvAdapter = new ClassValidatorAdapter();
        return _this;
    }
    /**
     * Make type metadata for a class
     * @param classType
     */
    DefaultMetadataStore.prototype.make = function (classType) {
        var e_1, _a;
        var _this = this;
        var rMetadata = reflect(classType);
        var cvMetadata = this.cvAdapter.extractMedatada(classType);
        var properties = rMetadata.properties
            .map(function (prop) { return _this.makePropertyMetadata(prop); })
            .filter(Boolean);
        var _loop_1 = function (cvMeta) {
            var existing = properties.find(function (prop) { return prop.name === cvMeta.propertyName; });
            var deduced = this_1.cvAdapter.makePropertyMetadata(cvMeta, existing);
            if (existing) {
                properties = properties.map(function (prop) {
                    return prop.name === cvMeta.propertyName ? deduced : existing;
                });
            }
            else {
                properties.push(deduced);
            }
        };
        var this_1 = this;
        try {
            for (var cvMetadata_1 = __values(cvMetadata), cvMetadata_1_1 = cvMetadata_1.next(); !cvMetadata_1_1.done; cvMetadata_1_1 = cvMetadata_1.next()) {
                var cvMeta = cvMetadata_1_1.value;
                _loop_1(cvMeta);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (cvMetadata_1_1 && !cvMetadata_1_1.done && (_a = cvMetadata_1["return"])) _a.call(cvMetadata_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var classMetadata = {
            name: rMetadata.name,
            properties: properties.filter(Boolean),
        };
        return (this.store[classType.name] = classMetadata);
    };
    DefaultMetadataStore.prototype.makePropertyMetadata = function (prop) {
        var _a;
        var decorator = this.getFixtureDecorator(prop);
        var meta = {
            name: prop.name,
            scalar: prop.typeClassification === 'Primitive',
        };
        if (decorator) {
            if (typeof decorator === 'function') {
                meta.input = decorator.bind(decorator, require('faker'));
            }
            else if (typeof decorator === 'string') {
                meta.input = function () { return decorator; };
            }
            else if (typeof decorator === 'object') {
                if (decorator.ignore)
                    return null;
                meta.input = decorator.get;
                meta.min = decorator.min || 1;
                meta.max = decorator.max || 3;
                meta.optional = decorator.optional || false;
                var inputType = (_a = decorator.type) === null || _a === void 0 ? void 0 : _a.call(decorator);
                if (inputType) {
                    if (Array.isArray(inputType)) {
                        inputType = inputType[0];
                        meta.array = true;
                    }
                    if (!inputType.prototype) {
                        throw new Error("Only pass class names to \"type\" in @Fixture({ type: () => Foo}) for \"" + meta.name + "\"");
                    }
                    var name_1 = inputType.name;
                    if (!['string', 'number', 'boolean'].includes(name_1.toLowerCase())) {
                        meta.type = name_1;
                    }
                    else {
                        meta.type = name_1.toLowerCase();
                    }
                }
                if (decorator["enum"]) {
                    meta["enum"] = true;
                    meta.items = getEnumValues(decorator["enum"]);
                }
            }
        }
        if (!meta.type) {
            if (!prop.type) {
                if (this.acceptPartialResult) {
                    return meta;
                }
            }
            else if (Array.isArray(prop.type)) {
                throw new Error("The type of \"" + meta.name + "\" seems to be an array. Use @Fixture({ type: () => Foo })");
            }
            else if (prop.type instanceof Function) {
                var name_2 = prop.type.name;
                if (!['string', 'number', 'boolean'].includes(name_2.toLowerCase())) {
                    meta.type = name_2;
                }
                else {
                    meta.type = name_2.toLowerCase();
                }
            }
        }
        if (!meta.type) {
            throw new Error("Couldn't extract the type of \"" + meta.name + "\". Use @Fixture({ type: () => Foo })");
        }
        return meta;
    };
    DefaultMetadataStore.prototype.getFixtureDecorator = function (prop) {
        var _a;
        return ((_a = prop.decorators.find(function (v) { return v.type === 'Fixture'; })) === null || _a === void 0 ? void 0 : _a.value) || null;
    };
    return DefaultMetadataStore;
}(BaseMetadataStore));

var FactoryLogger = /** @class */ (function () {
    function FactoryLogger() {
        this.rootTree = {};
        this.tree = {};
        this.duplicates = {};
    }
    FactoryLogger.prototype.start = function (meta, number) {
        if (number === void 0) { number = 0; }
        var entry = "Generated an instance of " + chalk.gray('"') + chalk.cyan(meta.name) + chalk.gray('"') + (number ? "" + chalk.gray(" (" + number + ")") : '');
        this.rootTree[entry] = {};
        this.tree = this.rootTree[entry];
    };
    FactoryLogger.prototype.onIgnoreProp = function (prop) {
        var name = chalk.cyan(prop.name);
        this.tree[name] = chalk.gray("(ignored)");
    };
    FactoryLogger.prototype.onCustomProp = function (prop) {
        var name = chalk.cyan(prop.name);
        this.tree[name] = chalk.gray("(custom value)");
    };
    FactoryLogger.prototype.onClassPropDone = function (prop, targetLogger) {
        var name = chalk.cyan(prop.name);
        if (this.tree[name]) {
            var number = (this.duplicates[prop.name] =
                (this.duplicates[prop.name] || 0) + 1);
            var entry = function (val) {
                return "Generated an instance of " + chalk.gray('"') + chalk.cyan(prop.type) + chalk.gray('"') + chalk.gray(" (" + val + ")");
            };
            var firstKey = Object.keys(this.tree[name])[0];
            if (number === 1) {
                this.tree[name][entry(number - 1)] = this.tree[name][firstKey];
                delete this.tree[name][firstKey];
            }
            this.tree[name][entry(number)] = targetLogger.rootTree;
        }
        else {
            this.tree[name] = targetLogger.rootTree;
        }
    };
    FactoryLogger.prototype.onNormalProp = function (prop, value) {
        var name = chalk.cyan(prop.name);
        this.tree[name] = value;
    };
    FactoryLogger.prototype.onClassValidator = function (prop, value) {
        var name = chalk.cyan(prop.name);
        this.tree[name] = chalk.gray('class-validator]') + " " + value;
    };
    FactoryLogger.prototype.onDone = function (duration) {
        this.tree[chalk.green('Done') + " " + chalk.gray("(" + duration + "ms)")] = null;
    };
    FactoryLogger.prototype.onError = function (duration) {
        this.tree[chalk.red('Error') + " " + chalk.gray("(" + duration + "ms)")] = null;
    };
    FactoryLogger.prototype.log = function () {
        return treeify.asTree(this.rootTree, true, false);
    };
    return FactoryLogger;
}());

var FixtureFactory = /** @class */ (function () {
    //private cvAdapter = new ClassValidatorAdapter();
    function FixtureFactory(options) {
        this.classTypes = {};
        this.DEFAULT_OPTIONS = {
            logging: false,
            maxDepth: 4,
        };
        this.loggers = [];
        this.assigner = this.defaultAssigner.bind(this);
        this.store = new DefaultMetadataStore();
        this.options = __assign(__assign({}, this.DEFAULT_OPTIONS), (options || {}));
    }
    FixtureFactory.prototype.defaultAssigner = function (prop, object, value) {
        object[prop.name] = value;
    };
    /**
     * Set a function to take charge of assigning values to
     * generated objects
     * @param fn
     */
    FixtureFactory.prototype.setAssigner = function (fn) {
        this.assigner = fn;
    };
    /**
     * You can set a custom metadata store
     * for extension purposes.
     * The store should extends `BaseMetadataStore`
     * @param store
     */
    FixtureFactory.prototype.setMetadataStore = function (store) {
        this.store = store;
    };
    /**
     * Returns the instance of the metadata store
     */
    FixtureFactory.prototype.getStore = function () {
        return this.store;
    };
    /**
     * Attemps to log a message.
     * Won't work if logging is disabled.
     * @param msg
     */
    FixtureFactory.prototype.log = function (msg, force) {
        if (force === void 0) { force = false; }
        if (force || this.options.logging) {
            console.log(chalk.gray('[FixtureFactory] '), msg);
        }
    };
    FixtureFactory.prototype.newLogger = function (meta) {
        this.loggers.unshift(new FactoryLogger());
        var logger = this.logger();
        logger.start(meta);
        return logger;
    };
    FixtureFactory.prototype.logger = function () {
        return this.loggers[0];
    };
    FixtureFactory.prototype.printLogger = function (dispose) {
        if (dispose === void 0) { dispose = false; }
        var logger = this.logger();
        if (!logger)
            return;
        this.log('\n' + logger.log());
        if (dispose) {
            this.disposeLogger();
        }
    };
    FixtureFactory.prototype.disposeLogger = function () {
        this.loggers.shift();
    };
    /**
     * Register classes to be used by the factory
     * @param classTypes
     */
    FixtureFactory.prototype.register = function (classTypes) {
        var e_1, _a;
        try {
            for (var classTypes_1 = __values(classTypes), classTypes_1_1 = classTypes_1.next(); !classTypes_1_1.done; classTypes_1_1 = classTypes_1.next()) {
                var classType = classTypes_1_1.value;
                this.store.make(classType);
                this.classTypes[classType.name] = classType;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (classTypes_1_1 && !classTypes_1_1.done && (_a = classTypes_1["return"])) _a.call(classTypes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * Generate fixtures
     * @param classType
     */
    FixtureFactory.prototype.make = function (classType) {
        var _this = this;
        this.store.make(classType);
        var meta = this.store.get(classType);
        var propsToIgnore = [];
        var userInput = {};
        var result = {
            one: function () {
                var e_2, _a;
                var error = false;
                var object = {};
                var startDate = new Date();
                _this.newLogger(meta);
                try {
                    object = _this._make(meta, classType, propsToIgnore);
                    try {
                        for (var _b = __values(Object.entries(userInput)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                            object[key] = value;
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                catch (err) {
                    _this.log(chalk.red("An error occured while generating \"" + meta.name + "\""), true);
                    console.error(err);
                    error = true;
                }
                var elapsed = +new Date() - +startDate;
                _this.logger()[error ? 'onError' : 'onDone'](elapsed);
                _this.printLogger(true);
                return error ? null : object;
            },
            many: function (x) {
                return __spread(Array(x).keys()).map(function () { return result.one(); });
            },
            "with": function (input) {
                var e_3, _a;
                userInput = input;
                try {
                    for (var _b = __values(Object.keys(input)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var key = _c.value;
                        propsToIgnore.push(key);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                return result;
            },
            ignore: function () {
                var props = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    props[_i] = arguments[_i];
                }
                propsToIgnore = propsToIgnore.concat(props);
                return result;
            },
        };
        return result;
    };
    FixtureFactory.prototype._make = function (meta, classType, propsToIgnore, depth) {
        var e_4, _a;
        if (propsToIgnore === void 0) { propsToIgnore = []; }
        if (depth === void 0) { depth = 0; }
        var object = new classType();
        try {
            for (var _b = __values(meta.properties), _c = _b.next(); !_c.done; _c = _b.next()) {
                var prop = _c.value;
                if (propsToIgnore.includes(prop.name))
                    continue;
                if (this.shouldIgnoreProperty(prop))
                    continue;
                this.assigner(prop, object, this.makeProperty(prop, meta, depth + 1));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return object;
    };
    FixtureFactory.prototype.shouldIgnoreProperty = function (prop) {
        //if (prop.type === 'method') return true;
        if (prop.ignore)
            return true;
        return false;
    };
    FixtureFactory.prototype.makeProperty = function (prop, meta, depth) {
        if (prop.input) {
            this.logger().onCustomProp(prop);
            return prop.input();
        }
        if (prop.scalar) {
            var value = this.makeScalarProperty(prop);
            this.logger().onNormalProp(prop, value);
            return value;
        }
        else if (prop.array) {
            return this.makeArrayProp(prop, meta, depth);
        }
        return this.makeObjectProp(meta, prop, depth);
    };
    FixtureFactory.prototype.makeScalarProperty = function (prop) {
        if (prop["enum"]) {
            if (prop.items) {
                return faker.random.arrayElement(prop.items);
            }
        }
        switch (prop.type) {
            case 'string':
                return faker.random.word();
            case 'number':
                return faker.random.number();
            case 'boolean':
                return faker.random.boolean();
            case 'Date':
                return faker.date.recent();
        }
        throw new Error("Can't generate a value for this scalar");
    };
    FixtureFactory.prototype.makeArrayProp = function (prop, meta, depth) {
        var _this = this;
        var amount = faker.random.number({
            max: prop.max,
            min: prop.min,
        });
        if (this.options.maxDepth && depth >= this.options.maxDepth)
            return [];
        if (['string', 'number', 'boolean', 'Date'].includes(prop.type)) {
            return __spread(Array(amount).keys()).map(function () {
                return _this.makeProperty(__assign(__assign({}, prop), { array: false, scalar: true }), meta, depth);
            });
        }
        return __spread(Array(amount).keys()).map(function () {
            return _this.makeProperty(__assign(__assign({}, prop), { array: false }), meta, depth);
        });
    };
    FixtureFactory.prototype.makeObjectProp = function (meta, prop, depth) {
        var refClassMeta = this.store.get(prop.type);
        var props = this.findRefSideProps(meta, prop);
        var oldLogger = this.logger();
        var logger = this.newLogger(refClassMeta);
        var value;
        if (!this.options.maxDepth ||
            !(this.options.maxDepth &&
                depth >= this.options.maxDepth &&
                prop.optional)) {
            value = this._make(refClassMeta, this.classTypes[prop.type], props.map(function (p) { return p.name; }), depth);
        }
        oldLogger.onClassPropDone(prop, logger);
        this.disposeLogger();
        return value;
    };
    FixtureFactory.prototype.findRefSideProps = function (meta, prop) {
        var e_5, _a;
        var props = [];
        var refClassMeta = this.store.get(prop.type);
        try {
            for (var _b = __values(refClassMeta.properties), _c = _b.next(); !_c.done; _c = _b.next()) {
                var refProp = _c.value;
                if (refProp.type === meta.name) {
                    props.push(refProp);
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return props;
    };
    return FixtureFactory;
}());

export { BaseMetadataStore, DefaultMetadataStore, FactoryLogger, Fixture, FixtureFactory, getEnumValues };
//# sourceMappingURL=class-fixtures-factory.esm.js.map
