import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';


/**
 *
 * @param {*} methods
 * @return {Array}
 */
export function normalizeMethods(methods) {
  const filter = method => isFunction(method);

  if (isArray(methods)) {
    return methods.filter(filter);
  }

  return Object.keys(methods)
    .map((key) => methods[key])
    .filter(filter);
}

/**
 *
 * @param {Model} model
 * @param {Array} mixins
 * @return {Array}
 */
export function normalizeMixinsMethods(model, mixins) {
  const methods = (mixins || [])
    .filter(mixin => typeof mixin.createMethods === 'function')
    .map(mixin => mixin.createMethods(model))
    .reduce((mixinsMethods, mixinMethods) => ({
      ...mixinsMethods,
      ...mixinMethods
    }), {});

  return normalizeMethods(methods);
}