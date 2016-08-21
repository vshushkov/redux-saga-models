import { methodNameToTypes, actionTypes } from '../../actions';

export const modelActionTypes = (modelName) => {

  const create = 'create';
  const updateById = 'updateById';
  const deleteById = 'deleteById';
  const find = 'find';
  const findById = 'findById';

  const types = actionTypes(modelName, [create, updateById, deleteById, find, findById]);

  return {
    create, updateById, deleteById, find, findById,
    ...types
  }
};