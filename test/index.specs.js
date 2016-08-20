import { expect } from 'chai';
import { combineReducers } from 'redux';
import { createModel, createModels } from '../src';
import api from '../src/helpers/api';
import crud from '../src/mixins/crud';
import { createSagaStore } from './utils';

describe('Index', () => {

  it('create model', (done) => {

    const userId = 'userId';
    const user = { id: userId, email: 'email@email.com' };
    const query = { id: userId };

    const fetch = (path, options) => {
      expect(path).to.equal(`/users/${userId}`);
      expect(options).to.have.property('method');
      expect(options.method).to.equal('get');
      expect(options).to.not.have.property('query');
      expect(options).to.not.have.property('body');
      return Promise.resolve(user);
    };

    const model = createModel({
      name: 'user',
      combineReducers,
      methods: {
        method(params) {
          return { ...params, success: 'ok' };
        },
        ...api({
          basePath: '/users',
          fetch,
          methods: {
            findById: {
              path: '/:id'
            }
          }
        })
      }
    });

    createSagaStore(model.model);

    const findByIdResult = model.selectors.findById(query);
    expect(findByIdResult.result).to.be.not.ok;
    expect(findByIdResult.fetching).to.be.ok;
    expect(findByIdResult.fetched).to.be.not.ok;

    const methodResult = model.selectors.method(query);
    expect(methodResult.result).to.be.not.ok;
    expect(methodResult.fetching).to.be.ok;
    expect(methodResult.fetched).to.be.not.ok;

    model.findById(query)
      .then(() => {
        const findByIdResult = model.selectors.findById(query);
        expect(findByIdResult.result).to.deep.equal(user);
        expect(findByIdResult.fetching).to.be.not.ok;
        expect(findByIdResult.fetched).to.be.ok;

        return model.method({ key: 'value' });
      })
      .then(() => {
        const result = model.selectors.method({ key: 'value' });
        expect(result.result).to.deep.equal({ key: 'value', success: 'ok' });
        expect(result.fetching).to.be.not.ok;
        expect(result.fetched).to.be.ok;
      })
      .then(() => done())
      .catch(done);

  });

  it('create model with custom reducer and selectors', (done) => {

    const token = 'secret';
    const request = { username: 'username', password: 'password' };
    const response = { access_token: token };

    const fetch = (path, options) => {
      expect(path).to.equal('/oauth/token');
      expect(options).to.have.property('method');
      expect(options.method).to.equal('post');
      expect(options).to.have.property('body');
      expect(options.body).to.deep.equal(request);
      return Promise.resolve(response);
    };

    const model = createModel({
      name: 'auth',
      combineReducers,
      methods: api({
        fetch,
        methods: {
          fetchToken: {
            path: '/oauth/token',
            method: 'post'
          }
        }
      }),

      reducer: ({ FETCH_TOKEN_SUCCESS }) =>
        (state = { accessToken: null }, action) =>
          action.type === FETCH_TOKEN_SUCCESS ? { accessToken: action.result.access_token } : state,

      selectors: {
        token: function() {
          return this.getModelState().model.accessToken
        }
      }
    });

    createSagaStore(model.model);

    model.fetchToken(request)
      .then(() => {
        const resultToken = model.selectors.token();
        expect(resultToken).to.equal(token);
        done()
      })
      .catch(done);

  });

  it('create models', () => {

    const models = createModels({
      models: [
        { name: 'model1' },
        { name: 'model2' },
        { name: 'model3' },
        { name: 'model4' }
      ],
      mixins: [crud({ fetch: () => {} })],
      fetch: () => {},
      combineReducers
    });

    expect(models).to.have.property('actions');
    expect(models.actions).to.have.property('model1');
    expect(models.actions.model1.find).to.be.a('function');
    expect(models.actions.model1.findById).to.be.a('function');
    expect(models.actions.model1.deleteById).to.be.a('function');
    expect(models.actions.model1.updateById).to.be.a('function');
    expect(models.actions.model1.create).to.be.a('function');
    expect(models.actions).to.have.property('model2');
    expect(models.actions).to.have.property('model3');
    expect(models.actions).to.have.property('model4');

    expect(models.sagas).to.be.an('array');
    expect(models.sagas.length).to.equal(20);

    expect(models.reducer).to.be.a('function');
    expect(models.setStore).to.be.a('function');

  });
});