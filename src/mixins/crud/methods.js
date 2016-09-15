import { modelActionTypes } from './actionTypes';
import api from '../../helpers/api';

const createModelMethods = (model, fetch) => {
  const { create, updateById, deleteById, find, findById } = modelActionTypes(model.config().name);
  const basePath = model.config().pluralName || '/';

  const methods = {
    [create]: {
      path: '/',
      method: 'post'
    },
    [updateById]: {
      path: '/:id',
      method: 'put'
    },
    [deleteById]: {
      path: '/:id',
      method: 'delete'
    },
    [find]: {
      path: '/',
      method: 'get'
    },
    [findById]: {
      path: '/:id',
      method: 'get'
    }
  };

  return api({ fetch, basePath, methods });
};

export default createModelMethods;