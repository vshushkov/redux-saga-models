/**
 * @todo write tests
 */

import { combineReducers as origCombineReducers } from 'redux';
import { normalizeMixinsMethods, normalizeMethods } from './methods';
import { createActions } from './actions';
import { createReducer } from './reducer';
import { createSelectors } from './selectors';
import { createSagas } from './sagas';

/**
 *
 */
class Model {

  constructor(modelConfig) {
    const { mixins, combineReducers = origCombineReducers } = modelConfig;
    this._config = modelConfig;

    const methods = normalizeMethods(this._config.methods || {});
    const mixinsMethods = normalizeMixinsMethods(this, mixins);

    this.reducer = createReducer(this, mixins, combineReducers);
    this.actions = createActions(this, [...methods, ...mixinsMethods]);
    this.sagas = createSagas(this, [...methods, ...mixinsMethods]);
    this.selectors = createSelectors(this, this._config.mixins);
  }

  config() {
    return this._config;
  }

  setStore(store, stateToModels = (state) => state) {
    this.dispatch = store.dispatch;
    this.getState = store.getState;
    this.getModelState = () => stateToModels(store.getState())[this.config().name];
  }
}

function _createModel(model) {
  return {
    ...model.actions,
    selectors: model.selectors,
    sagas: model.sagas,
    reducer: model.reducer,
    model
  };
}


/**
 * @param {Object} config
 * @param {String} config.name
 * @return {*}
 */
export function createModel(config) {
  const model = new Model(config);
  return _createModel(model);
}

/**
 * @param {Array} models
 * @param {Array} [mixins]
 * @param {Function} [fetch]
 * @param {Function} [combineReducers]
 * @param {Function} [stateToModels]
 * @return {{models: *, reducer: *, sagas: *}}
 */
export function createModels({
  models, mixins = [], fetch = null, combineReducers = origCombineReducers,
  stateToModels = (state) => state.models }
) {
  const impls = models
    .map(modelConfig => new Model({
      ...modelConfig,
      fetch: fetch || modelConfig.fetch,
      combineReducers: combineReducers || modelConfig.combineReducers,
      mixins: [...mixins, ...(modelConfig.mixins || [])]
    }));

  const modelsObject = impls.reduce((models, model) => ({
    ...models, [model.config().name]: _createModel(model)
  }), {});

  const actions = impls.reduce((actions, model) => ({
    ...actions, [model.config().name]: model.actions
  }), {});

  const sagas = impls.reduce((sagas, model) => ([
    ...sagas, ...model.sagas
  ]), []);

  const reducer = combineReducers(impls.reduce((reducers, model) => ({
    ...reducers, [model.config().name]: model.reducer
  }), {}));

  const setStore = (store) => {
    impls.forEach((model) => model.setStore(store, stateToModels))
  };

  return { models: modelsObject, actions, sagas, reducer, setStore };
}