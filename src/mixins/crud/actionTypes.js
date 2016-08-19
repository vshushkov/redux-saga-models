;import { methodNameToTypes } from '../../actions';

export const modelActionTypes = (modelName) => {

  const create = 'create';
  const updateById = 'updateById';
  const deleteById = 'deleteById';
  const find = 'find';
  const findById = 'findById';

  const [CREATE, CREATE_SUCCESS, CREATE_ERROR] = methodNameToTypes(modelName, create);
  const [UPDATE_BY_ID, UPDATE_BY_ID_SUCCESS, UPDATE_BY_ID_ERROR] = methodNameToTypes(modelName, updateById);
  const [DELETE_BY_ID, DELETE_BY_ID_SUCCESS, DELETE_BY_ID_ERROR] = methodNameToTypes(modelName, deleteById);
  const [FIND, FIND_SUCCESS, FIND_ERROR] = methodNameToTypes(modelName, find);
  const [FIND_BY_ID, FIND_BY_ID_SUCCESS, FIND_BY_ID_ERROR] = methodNameToTypes(modelName, findById);

  return {
    create, updateById, deleteById, find, findById,
    CREATE, CREATE_SUCCESS, CREATE_ERROR,
    UPDATE_BY_ID, UPDATE_BY_ID_SUCCESS, UPDATE_BY_ID_ERROR,
    DELETE_BY_ID, DELETE_BY_ID_SUCCESS, DELETE_BY_ID_ERROR,
    FIND, FIND_SUCCESS, FIND_ERROR,
    FIND_BY_ID, FIND_BY_ID_SUCCESS, FIND_BY_ID_ERROR
  }
};