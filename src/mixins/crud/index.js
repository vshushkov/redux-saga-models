import createModelMethods from './methods';
import createReducer from './reducer';
import createSelectors from './selectors';
import * as actionTypes from './actionTypes';

export const name = 'crud';

export default function({ fetch }) {
  return {
    name,
    createMethods: (model) => createModelMethods(model, fetch),
    createReducer,
    createSelectors,
    actionTypes
  }
};