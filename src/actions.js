import snakeCase from 'lodash/snakeCase';

const typePrefix = '@@redux-saga-models/';

export function methodNameToTypes(modelName, methodName) {
  const type = `${typePrefix}${snakeCase(modelName).toUpperCase()}/${snakeCase(methodName).toUpperCase()}`;
  return [
    type, `${type}_SUCCESS`, `${type}_ERROR`
  ]
}

export function actionTypes(modelName, methods) {
  return methods
    .reduce((types, method) => {
      const methodName = method.name || method;
      const [type, success, error] = methodNameToTypes(modelName, methodName);
      types[snakeCase(methodName).toUpperCase()] = type;
      types[snakeCase(`${methodName}Success`).toUpperCase()] = success;
      types[snakeCase(`${methodName}Error`).toUpperCase()] = error;
      return types;
    }, {});
}

export function createAction(model, method) {
  if (typeof method !== 'function') {
    return function (...params) {
      const meta = params.length <= 2 ? params[1] || {} : params.slice(1, params.length);
      this.dispatch({ type, payload: params[0], meta });
    }.bind(model);
  }

  const [type, success, failure] = methodNameToTypes(model.config().name, method.name);
  return function (...params) {
    return new Promise((resolve, reject) => {
      const meta = { params, types: { success, failure }, callbacks: { resolve, reject } };
      this.dispatch({ type, meta });
    })
  }.bind(model);
}

export function createActions(model, allMethods) {
  return allMethods
    .reduce((actions, method) => ({
      ...actions, [method.name || method]: createAction(model, method)
    }), {});
}