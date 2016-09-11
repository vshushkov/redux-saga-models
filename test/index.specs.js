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
    expect(findByIdResult.requesting).to.be.ok;
    expect(findByIdResult.requested).to.be.not.ok;

    const methodResult = model.selectors.method(query);
    expect(methodResult.result).to.be.not.ok;
    expect(methodResult.requesting).to.be.ok;
    expect(methodResult.requested).to.be.not.ok;

    model.findById(query)
      .then(() => {
        const findByIdResult = model.selectors.findById(query);
        expect(findByIdResult.result).to.deep.equal(user);
        expect(findByIdResult.requesting).to.be.not.ok;
        expect(findByIdResult.requested).to.be.ok;

        return model.method({ key: 'value' });
      })
      .then(() => {
        const result = model.selectors.method({ key: 'value' });
        expect(result.result).to.deep.equal({ key: 'value', success: 'ok' });
        expect(result.requesting).to.be.not.ok;
        expect(result.requested).to.be.ok;
      })
      .then(() => done())
      .catch(done);

  });

  it('create model with custom reducer/selectors #1', (done) => {

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
      methods: api({
        fetch,
        methods: {
          fetchToken: {
            path: '/oauth/token',
            method: 'post'
          }
        }
      }),

      reducers: ({ FETCH_TOKEN_SUCCESS }) =>
        (state = { accessToken: null }, action) =>
          action.type === FETCH_TOKEN_SUCCESS ? { accessToken: action.payload.access_token } : state,

      selectors: {
        token() {
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

  it('create model with custom reducer/selectors #2', (done) => {

    const token = 'secret';
    const username = 'username';
    const password = 'password';

    const user = createModel({
      name: 'user',
      methods: {
        login(username, password) {
          return Promise.resolve({ token, username, password });
        }
      },

      selectors: {
        token: function () {
          return this.getModelState().login[0].result
        }
      }
    });

    createSagaStore(user.model);

    user.login(username, password)
      .then(() => {
        const result = user.selectors.login(username, password);

        expect(result.result).to.deep.equal({ token, username, password });
        expect(result.requesting).to.be.not.ok;
        expect(result.requested).to.be.ok;

        expect(user.selectors.token()).to.deep.equal({ token, username, password });

        done();
      })
      .catch(done);
  });

  it('create model with custom reducer/selectors #3', (done) => {

    const token = 'secret';
    const username = 'username';
    const password = 'password';

    const findByIdResponse = (id) => ({ id, email: `${id}@email.com` });
    const loginResponse = (username, password) => ({ token: username + '-' + password });

    const user = createModel({
      name: 'user',
      methods: {
        login(username, password) {
          return Promise.resolve(loginResponse(username, password));
        },
        findById(id) {
          return findByIdResponse(id);
        }
      },

      reducers: {
        login: (state, action) => {
          return !action.error && action.payload ? action.payload.token || null : null;
        }
      },

      selectors: {
        token() {
          return this.getModelState().login;
        }
      }
    });

    createSagaStore(user.model);

    const result1 = user.selectors.login(username, password);
    expect(result1).to.deep.equal(null);

    const result2 = user.selectors.login('bla-bla');
    expect(result2).to.deep.equal(null);

    const result3 = user.selectors.findById('user-id');
    expect(result3.result).to.deep.equal(null);
    expect(result3.requesting).to.be.ok;
    expect(result3.requested).to.be.not.ok;

    user.login(username, password)
      .then((response) => {
        expect(response).to.deep.equal(loginResponse(username, password));

        expect(user.selectors.login(username, password)).to.equal(response.token);
        expect(user.selectors.login('blabla')).to.equal(response.token);
        expect(user.selectors.token()).to.equal(response.token);
      })

      .then(() => user.findById('user-id'))
      .then((response) => {
        expect(response).to.deep.equal(findByIdResponse('user-id'));

        const result = user.selectors.findById('user-id');
        expect(result.result).to.deep.equal(findByIdResponse('user-id'));
        expect(result.requesting).to.be.not.ok;
        expect(result.requested).to.be.ok;
      })

      .then(() => user.findById('another-user-id'))
      .then((response) => {
        expect(response).to.deep.equal(findByIdResponse('another-user-id'));

        const result1 = user.selectors.findById('another-user-id');
        expect(result1.result).to.deep.equal(findByIdResponse('another-user-id'));
        expect(result1.requesting).to.be.not.ok;
        expect(result1.requested).to.be.ok;

        const result2 = user.selectors.findById('user-id');
        expect(result2.result).to.deep.equal(findByIdResponse('user-id'));
        expect(result2.requesting).to.be.not.ok;
        expect(result2.requested).to.be.ok;
      })
      .then(() => done())
      .catch(done);
  });

  it('create model with custom reducer/selectors #4', (done) => {

    const username = 'username';
    const password = 'password';

    const findByIdResponse = (id) => ({ id, email: `${id}@email.com` });
    const loginResponse = (username, password) => ({ token: username + '-' + password });

    const user = createModel({
      name: 'user',
      methods: {
        login(username, password) {
          return Promise.resolve(loginResponse(username, password));
        },
        findById(id) {
          return findByIdResponse(id);
        }
      },

      reducers: ({ LOGIN_SUCCESS }) => ({
        login: (state, action) => {
          if (LOGIN_SUCCESS) {
            return action.payload && action.payload.token ? action.payload.token : null
          }

          return state;
        }
      }),

      selectors: {
        token() {
          return this.getModelState().login;
        }
      }
    });

    createSagaStore(user.model);

    const result1 = user.selectors.login(username, password);
    expect(result1).to.deep.equal(null);

    const result2 = user.selectors.login('bla-bla');
    expect(result2).to.deep.equal(null);

    const result3 = user.selectors.findById('user-id');
    expect(result3.result).to.deep.equal(null);
    expect(result3.requesting).to.be.ok;
    expect(result3.requested).to.be.not.ok;

    user.login(username, password)
      .then((response) => {
        expect(response).to.deep.equal(loginResponse(username, password));

        expect(user.selectors.login(username, password)).to.equal(response.token);
        expect(user.selectors.login('blabla')).to.equal(response.token);
        expect(user.selectors.token()).to.equal(response.token);
      })

      .then(() => user.findById('user-id'))
      .then((response) => {
        expect(response).to.deep.equal(findByIdResponse('user-id'));

        const result = user.selectors.findById('user-id');
        expect(result.result).to.deep.equal(findByIdResponse('user-id'));
        expect(result.requesting).to.be.not.ok;
        expect(result.requested).to.be.ok;
      })

      .then(() => user.findById('another-user-id'))
      .then((response) => {
        expect(response).to.deep.equal(findByIdResponse('another-user-id'));

        const result1 = user.selectors.findById('another-user-id');
        expect(result1.result).to.deep.equal(findByIdResponse('another-user-id'));
        expect(result1.requesting).to.be.not.ok;
        expect(result1.requested).to.be.ok;

        const result2 = user.selectors.findById('user-id');
        expect(result2.result).to.deep.equal(findByIdResponse('user-id'));
        expect(result2.requesting).to.be.not.ok;
        expect(result2.requested).to.be.ok;
      })
      .then(() => done())
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
      fetch: () => {}
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