import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import { normalizeMethods } from './methods';

/**
 *
 * @param {Model} model
 * @param {Function} method
 * @param {Boolean} returnAsIs
 * @return {Object}
 */
function defaultMethodSelector(model, method, returnAsIs) {
  const methodName = method.name;
  return function(...params) {
    const state = this.getModelState()[methodName];
    if (returnAsIs) {
      return state;
    }

    const result = (state || []).find(row => isEqual(params, row.params));
    return result || { result: null, fetching: true, fetched: false };
  }.bind(model);
}

function createModelSelectors(model) {
  const defaultSelectors = (model.methods || [])
    .reduce((selectors, method) => ({
      ...selectors,
      [method.name]: defaultMethodSelector(model, method, model.isReducerAsOverridden(method.name))
    }), {});

  const customSelectors = Object.keys(model.config().selectors || {})
    .filter(selectorName => isFunction(model.config().selectors[selectorName]))
    .reduce((selectors, selectorName) => ({
      ...selectors,
      [selectorName]: model.config().selectors[selectorName].bind(model)
    }), {});

  return {
    ...defaultSelectors,
    ...customSelectors
  };
}

/**
 * @param {Model} model
 * @param {Array} [mixins]
 * @return {Object}
 */
export function createSelectors(model, mixins = []) {
  const modelSelectors = createModelSelectors(model);

  const mixinsSelectors = mixins.reverse()
    .filter((mixin => typeof mixin.createSelectors === 'function'))
    .reduce((selectors, mixin) => ({
      ...selectors,
      ...mixin.createSelectors(model)
    }), {});

  return {
    ...modelSelectors,
    ...mixinsSelectors
  }
}