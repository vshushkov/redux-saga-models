import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import { normalizeMethods } from './methods';

/**
 *
 * @param {Model} model
 * @param {Array} methods
 * @return {Object}
 */
function defaultSelectors(model, methods) {
  return normalizeMethods(methods)
    .reduce((selectors, method) => ({
      ...selectors,
      [method.name || method]: function(params) {
        const state = this.getModelState().model;
        const result = (state[method.name || method] || [])
          .find(row => isEqual(params, row.params));

        if (!result) {
          return method.name ? { result: null, fetching: true, fetched: false } : null;
        }

        return method.name ? result : result.result;
      }.bind(model)
    }), {});
}

function createModelSelectors(model) {
  if (isEmpty(model.config().selectors)) {
    return defaultSelectors(model, model.config().methods || {});
  }

  return Object.keys(model.config().selectors || {})
    .filter(selectorName => isFunction(model.config().selectors[selectorName]))
    .reduce((selectors, selectorName) => ({
      ...selectors,
      [selectorName]: model.config().selectors[selectorName].bind(model)
    }), {});
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