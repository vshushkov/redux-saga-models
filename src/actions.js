import snakeCase from 'lodash/snakeCase';

const typePrefix = '@@redux-saga-models/';

export function methodNameToTypes(modelName, methodName) {
  const type = `${typePrefix}${snakeCase(modelName).toUpperCase()}/${snakeCase(methodName).toUpperCase()}`;
  return [
    type, `${type}_SUCCESS`, `${type}_ERROR`
  ]
}

export function createAction(model, methodName) {
  const [type, success, failure] = methodNameToTypes(model.config().name, methodName);
  return function(params) {
    return new Promise((resolve, reject) => {
      this.dispatch({ type, params, types: { success, failure }, callbacks: { resolve, reject } });
    })
  }.bind(model);
}

export function createActions(model, allMethods) {
  return allMethods
    .reduce((actions, method) => ({
      ...actions,
      [method.name || method]: createAction(model, method.name || method)
    }), {});
}