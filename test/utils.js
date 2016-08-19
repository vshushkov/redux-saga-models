import { fork } from 'redux-saga/effects';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware, { END } from 'redux-saga';

export function createSagaStore(model) {
  function* rootSaga() {
    yield model.sagas.map(saga => fork(saga));
  }

  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(combineReducers({
    [model.config().name]: model.reducer
  }), applyMiddleware(sagaMiddleware));

  sagaMiddleware.run(rootSaga);
  store.close = () => store.dispatch(END);

  model.setStore(store);
}