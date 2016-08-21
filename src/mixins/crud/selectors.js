import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import { name as mixinName } from './index';

function _findById(modelSate, { id }) {
  if (!modelSate || isEmpty(modelSate.byId)) {
    return { requesting: true, record: {} };
  }

  return modelSate.byId[id] || { requesting: true, record: {} };
}

function _find(modelSate, params = {}) {
  if (!modelSate) {
    return { requesting: true, records: [] };
  }

  const collections = modelSate.collections;
  const entry = collections.find(collection => isEqual(collection.params, params));

  if (!entry || isEmpty(modelSate.byId)) {
    return { requesting: true, records: [] };
  }

  const records = entry.ids.map(id => modelSate.byId[id]);


  return { ... entry, records };
}

export default function createSelectors(model) {
  function findById({ id }) {
    const mixinSate = this.getModelState()[mixinName];
    return _findById(mixinSate, { id });
  }

  function find(...params) {
    const mixinSate = this.getModelState()[mixinName];
    return _find(mixinSate, params);
  }

  return {
    findById: findById.bind(model),
    find: find.bind(model)
  };
}

