import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

import { modelActionTypes, relationActionTypes } from './actionTypes';

/**
 * State schema:
 *
 * {
 *   byId: {
 *     [id]: {
 *       record: { entity object },
 *       requested: true,
 *       requesting: false,
 *       error: {}
 *     }
 *   },
 *   collections: [
 *     {
 *       params: { "primary key" },
 *       requested: true,
 *       requesting: false,
 *       error: {},
 *       ids: [1, 2, 3, 4, ...]
 *     },
 *     ...
 *   ]
 * }
 */

/**
 *
 * @param {Object} model
 * @return {Function}
 */
export default function createReducer(model) {
  return createModelReducer({ types: modelActionTypes(model.config().name) });
}

function createModelReducer({ types }) {
  const { CREATE_SUCCESS,
    UPDATE_BY_ID, UPDATE_BY_ID_SUCCESS, UPDATE_BY_ID_ERROR,
    DELETE_BY_ID, DELETE_BY_ID_SUCCESS, DELETE_BY_ID_ERROR,
    FIND, FIND_SUCCESS, FIND_ERROR,
    FIND_BY_ID, FIND_BY_ID_SUCCESS, FIND_BY_ID_ERROR } = types;

  /*
   * Initial states
   */

  const byIdInitialState = {};

  const byIdDocumentInitialState = {
    requesting: false,
    requested: false,
    fetchTime: null,
    error: null,
    record: null
  };

  const collectionInitialState = {
    requesting: false,
    params: {},
    ids: [],
    fetchTime: null,
    error: null
  };

  const collectionsInitialState = [];

  const modelInitialState = {
    byId: byIdInitialState,
    collections: collectionsInitialState
  };

  /*
   * Reducers
   */

  function byIdReducer(state = byIdInitialState, action) {
    let id = null;
    if (action.meta.params && action.meta.params[0] && action.meta.params[0].id) {
      id = action.meta.params[0].id;
    } else if (action.payload && action.payload.id) {
      id = action.payload.id;
    }

    const fetchTime = action.meta.fetchTime;
    const response = !action.error ? action.payload : null;
    const error = action.error ? action.payload : null;

    switch (action.type) {
      case FIND_SUCCESS:
        return {
          ...state,
          ...(action.payload.reduce((records, record) => {
            records[record.id] = {
              ...byIdDocumentInitialState,
              record,
              fetchTime,
              error,
              requesting: false,
              requested: true
            };

            return records;
          }, {}))
        };

      case FIND_BY_ID:
      case UPDATE_BY_ID:
        return {
          ...state,
          [id]: {
            ...(state[id] || byIdDocumentInitialState),
            requesting: true
          }
        };

      case CREATE_SUCCESS:
      case FIND_BY_ID_SUCCESS:
      case UPDATE_BY_ID_SUCCESS:
        return {
          ...state,
          [id]: {
            ...(state[id] || byIdDocumentInitialState),
            requesting: false,
            requested: true,
            record: response,
            fetchTime,
            error: null
          }
        };

      case FIND_BY_ID_ERROR:
        return {
          ...state,
          [id]: {
            ...(state[id] || byIdDocumentInitialState),
            requesting: false,
            fetchTime,
            error
          }
        };

      case DELETE_BY_ID_SUCCESS:
        return {
          ...state,
          [id]: undefined
        };

      default:
        return state
    }
  }

  /*
   * Note: fetchTime of null means "needs fetch"
   */
  function collectionReducer(state = collectionInitialState, action) {
    const fetchTime = action.meta.fetchTime;
    const params = action.meta.params || {};
    const response = !action.error ? action.payload : null;
    const error = action.error ? action.payload : null;

    switch (action.type) {
      case FIND:
        return {
          ...state,
          requesting: true,
          params: params,
          error: null,
          fetchTime: null
        };

      case FIND_SUCCESS:
        return {
          ...state,
          requesting: false,
          requested: true,
          params: params,
          ids: response.map(record => record.id),
          error: null,
          fetchTime: fetchTime
        };

      case FIND_ERROR:
        return {
          ...state,
          requesting: false,
          params: params,
          error: error,
          fetchTime: fetchTime
        };

      default:
        return state
    }
  }

  function collectionsReducer(state = collectionsInitialState, action) {
    const params = action.meta.params || {};

    switch (action.type) {

      case FIND:
      case FIND_SUCCESS:
      case FIND_ERROR:
        const findIndex = state.findIndex(collection => isEqual(collection.params, params));

        if (findIndex === -1) {
          return [...state, collectionReducer(collectionInitialState, action)];
        }

        return [
          ...state.slice(0, findIndex),
          collectionReducer(state[findIndex], action),
          ...state.slice(findIndex + 1, state.length)
        ];

      case CREATE_SUCCESS:
      case DELETE_BY_ID_SUCCESS:
        return state.map(item => ({ ...item, fetchTime: null }));

      default:
        return state
    }
  }

  return function crudReducer(state = modelInitialState, action) {
    switch (action.type) {

      case FIND:
      case FIND_SUCCESS:
      case FIND_ERROR:
        return {
          ...state,
          collections: collectionsReducer(state.collections, action),
          byId: byIdReducer(state.byId, action)
        };

      case FIND_BY_ID:
      case FIND_BY_ID_SUCCESS:
      case FIND_BY_ID_ERROR:
        return {
          ...state,
          byId: byIdReducer(state.byId, action)
        };

      case CREATE_SUCCESS:
        return {
          ...state,
          collections: collectionsReducer(state.collections, action),
          byId: byIdReducer(state.byId, action)
        };

      case UPDATE_BY_ID:
      case UPDATE_BY_ID_SUCCESS:
      case UPDATE_BY_ID_ERROR:
        return {
          ...state,
          byId: byIdReducer(state.byId, action)
        };

      case DELETE_BY_ID:
      case DELETE_BY_ID_SUCCESS:
      case DELETE_BY_ID_ERROR:
        return {
          ...state,
          byId: byIdReducer(state.byId, action),
          collections: collectionsReducer(state.collections, action)
        };

      default:
        return state
    }
  }
}