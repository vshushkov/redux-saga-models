import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import flatten from 'lodash/flatten';
import snakeCase from 'lodash/snakeCase';
import { methodNameToTypes } from './actions';
import { normalizeMethods, normalizeMixinsMethods } from './methods';

/**
 *
 * @param {Model} model
 * @return {Function}
 */
export function defaultReducer(model) {
  const methods = normalizeMethods(model.config().methods || {});
  const types = methods.reduce((types, method) => {
    const [type, success, failure] = methodNameToTypes(model.config().name, method.name);
    if (isFunction(method)) {
      types[type] = types[success] = types[failure] = method.name;
    }

    return types;
  }, {});

  const initialMethodState = { params: null, result: null, fetching: false, fetched: false };
  const initialState = methods.reduce((methods, method) => ({
    ...methods, [method.name || method]: []
  }), {});

  return (state = initialState, action) => {
    const key = types[action.type];
    if (!key) {
      return state;
    }

    const index = state[key].findIndex(row => isEqual(row.params, action.params));

    if (index === -1) {
      return {
        ...state,
        [key]: [...state[key], {
          ...initialMethodState,
          params: action.params,
          fetching: true
        }]
      }
    }

    if (action.type.endsWith('_SUCCESS') || action.type.endsWith('_ERROR') || !types[`${action.type}_SUCCESS`]) {
      return {
        ...state,
        [key]: [...state[key].slice(0, index), {
          ...state[key][index],
          result: action.result,
          fetching: false,
          fetched: true
        }, ...state[key].slice(index + 1, state[key].length)]
      }
    }

    return {
      ...state,
      [key]: [...state[key].slice(0, index), {
        ...state[key][index],
        fetching: true
      }, ...state[key].slice(index + 1, state[key].length)]
    }
  };
}

/**
 * @param {Model} model
 * @param {Array} mixins
 * @param {Function} combineReducers
 * @return {Function}
 */
export function createReducer(model, mixins, combineReducers) {
  const types = normalizeMethods(model.config().methods || {})
    .reduce((types, method) => {
      const methodTypes = methodNameToTypes(model.config().name, method.name);
      types[snakeCase(method.name).toUpperCase()] = methodTypes[0];
      types[snakeCase(`${method.name}Success`).toUpperCase()] = methodTypes[1];
      types[snakeCase(`${method.name}Error`).toUpperCase()] = methodTypes[2];
      return types;
    }, {});

  const modelReducer = isFunction(model.config().reducer) ?
    model.config().reducer(types) : defaultReducer(model);

  const mixinsReducers = (mixins || [])
    .filter(mixin => isFunction(mixin.createReducer))
    .reduce((reducers, mixin) => ({
      ...reducers,
      [mixin.name]: mixin.createReducer(model, combineReducers)
    }), {});

  return combineReducers({
    ...mixinsReducers,
    model: modelReducer
  });
}