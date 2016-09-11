import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import flatten from 'lodash/flatten';
import snakeCase from 'lodash/snakeCase';
import { methodNameToTypes, actionTypes } from './actions';
import { normalizeMethods, normalizeMixinsMethods } from './methods';

/**
 *
 * @param {Model} model
 * @param {String|Function} method
 * @return {Function}
 */
function createMethodReducer(model, method) {
  if (!isFunction(method)) {
    return (state, action) => action;
  }

  const initialResultState = { params: null, result: null, requesting: false, requested: false, error: null };
  const initialState = [];
  const [TYPE, SUCCESS, ERROR] = methodNameToTypes(model.config().name, method.name || method);

  return (state = initialState, action) => {
    if (![TYPE, SUCCESS, ERROR].includes(action.type)) {
      return state;
    }

    const error = action.type === ERROR ? action.payload : null;
    const params = action.meta && action.meta.params ? action.meta.params || null : null;
    const requesting = action.type === TYPE;
    const requested = action.type !== TYPE;
    const index = state.findIndex(row => isEqual(row.params, params));

    if (index === -1) {
      return [
        ...state,
        { ...initialResultState, params, error, requesting, requested }
      ]
    }

    const result = action.type === TYPE ? state[index].result : (
      action.type !== ERROR ? (action.payload || null) : null
    );

    return [
      ...state.slice(0, index),
      { ...state[index], result, error, requesting, requested: true },
      ...state.slice(index + 1, state.length)
    ];
  };
}

/**
 *
 * @param {Model} model
 * @param {Array} modelMethods
 * @return {Object}
 */
function createModelReducers(model, modelMethods) {
  let reducers = model.config().reducers || {};

  if (isFunction(reducers) && reducers.length === 1) {
    reducers = reducers(actionTypes(model.config().name, modelMethods));
  }

  if (isFunction(reducers)) {
    return { model: reducers };
  }

  return Object.keys(reducers)
    .reduce((result, reducerName) => {
      const method = modelMethods.find(method => method.name === reducerName);
      if (method) {
        model._markReducerAsOverridden(reducerName);
        const [type, success, error] = methodNameToTypes(model.config().name, method.name);
        result[reducerName] = (state = null, action) => {
          if ([type, success, error].includes(action.type)) {
            return reducers[reducerName](state, action);
          }

          return state;
        }
      } else {
        result[reducerName] = reducers[reducerName];
      }

      return result;
    }, {});
}

/**
 * @param {Model} model
 * @param {Array} mixins
 * @param {Function} combineReducers
 * @return {Function}
 */
export function createReducer(model, mixins, combineReducers) {
  const modelMethods = normalizeMethods(model.config().methods || {});

  const methodsReducers = modelMethods
    .reduce((reduces, method) => ({
      ...reduces, [method.name || method]: createMethodReducer(model, method)
    }), {});

  const modelReducers = createModelReducers(model, modelMethods);

  const mixinsReducers = (mixins || [])
    .filter(mixin => isFunction(mixin.createReducer))
    .reduce((reducers, mixin) => {
      const reducer = mixin.createReducer(model, combineReducers);
      if (!reducer) {
        return reducers;
      }

      return { ...reducers, [mixin.name]: reducer };
    }, {});

  return combineReducers({
    ...methodsReducers,
    ...modelReducers,
    ...mixinsReducers
  });
}