import { takeEvery } from 'redux-saga';
import { put, call } from 'redux-saga/effects';

import { methodNameToTypes } from './actions';

/**
 *
 * @param {Function} method
 * @return {Function}
 */
export const createMethod = (method) => {
  return function* createdSagaApiMethod({ meta }) {
    const { params, types: { success, failure }, callbacks: { resolve, reject } } = meta;

    try {
      const result = yield call(method, ...params);
      yield put({ type: success, payload: result, meta: { params } });
      if (typeof resolve === 'function') {
        resolve(result);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      yield put({ type: failure, payload: error, error: true, meta: { params } });
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
    .filter(method => typeof method === 'function')
    .map(method => {
      const [type] = methodNameToTypes(model.config().name, method.name);
      return function* () {
        yield* takeEvery(type, createMethod(method));
      }
    });
}