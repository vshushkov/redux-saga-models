import { takeEvery } from 'redux-saga';
import { put, call } from 'redux-saga/effects';

import { methodNameToTypes } from './actions';

/**
 *
 * @param {Function} method
 * @return {Function}
 */
export const createMethod = (method) => {
  return function* createdSagaApiMethod({ params, types: { success, failure }, callbacks: { resolve, reject } }) {
    try {
      const result = yield call(method, params);
      yield put({ type: success, result, params });
      if (typeof resolve === 'function') {
        resolve(result);
      }
    } catch (error) {
      yield put({ type: failure, params, error });
      if (typeof resolve === 'function') {
        reject(error);
      }
    }
  }
};

/**
 *
 * @param {Model} model
 * @param {Array} methods
 * @return {Array}
 */
export function createSagas(model, methods) {
  return methods
    .map(method => {
      const [type] = methodNameToTypes(model.config().name, method.name);
      return function* () {
        yield* takeEvery(type, createMethod(method));
      }
    });
}