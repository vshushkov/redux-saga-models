import isEqual from 'lodash/isEqual';
import { expect } from 'chai';
import { combineReducers } from 'redux';
import { createModel } from '../src/index';
import api from '../src/helpers/api';
import crud from '../src/mixins/crud';
import { createSagaStore } from './utils';

let users = [
  { id: 'user1', email: 'email1@email.com' },
  { id: 'user2', email: 'email2@email.com' },
  { id: 'user3', email: 'email3@email.com' },
  { id: 'user4', email: 'email4@email.com' }
];

const query1 = { where: { email: 'email2@email.com' } };
const query2 = { where: { id: 'user3' } };
const query3 = { order: 'created DESC' };

const fetch = (path, options) => {
  if (path === '/users/logout') {
    return Promise.resolve();
  }

  if (isEqual(options.query, query1)) {
    return Promise.resolve([users[1]]);
  }

  if (isEqual(options.query, query2)) {
    return Promise.resolve([users[2]]);
  }

  if (isEqual(options.query, query3)) {
    return Promise.resolve(users.reverse());
  }

  if (path.startsWith('/users/user')) {
    const index = users.findIndex(user => user.id.slice(-1) === path.slice(-1));

    if (index === -1) {
      return Promise.reject({ error: 'not found' });
    }

    if (options.method === 'get') {
      return Promise.resolve(users[index]);
    }

    if (options.method === 'delete') {
      const user = users[index];

      users = [
        ...users.slice(0, index),
        ...users.slice(index + 1, users.length)
      ];

      return Promise.resolve(user);
    }

    if (options.method === 'put') {
      users[index] = { ...users[index], ...options.body };
      return Promise.resolve(users[index]);
    }
  }

  if (path === '/users' && options.method === 'post') {
    users.push({ ...options.body, id: `user${users.length + 1}` });

    return Promise.resolve(users[users.length - 1]);
  }

  return Promise.resolve(users);
};

describe('CRUD mixin', () => {

  it('create model', (done) => {

    const model = createModel({
      name: 'user',
      pluralName: 'users',
      combineReducers,
      mixins: [crud({ fetch })],
      methods: api({
        basePath: 'users',
        fetch,
        methods: {
          logout: {
            path: '/logout'
          }
        }
      })
    });

    const store = createSagaStore(model.model);

    expect(model.create).to.be.a('function');
    expect(model.updateById).to.be.a('function');
    expect(model.deleteById).to.be.a('function');
    expect(model.find).to.be.a('function');
    expect(model.findById).to.be.a('function');
    expect(model.logout).to.be.a('function');

    const findByIdResult = model.selectors.findById({ id: 'user1' });
    expect(findByIdResult.record).to.deep.equal({});
    expect(findByIdResult.requesting).to.be.ok;

    const find1Result = model.selectors.find(query1);
    expect(find1Result.records).to.deep.equal([]);
    expect(find1Result.requesting).to.be.ok;

    const find2Result = model.selectors.find(query2);
    expect(find2Result.records).to.deep.equal([]);
    expect(find2Result.requesting).to.be.ok;

    const find3Result = model.selectors.find(query3);
    expect(find3Result.records).to.deep.equal([]);
    expect(find3Result.requesting).to.be.ok;

    const logoutResult = model.selectors.logout();
    expect(logoutResult.result).to.be.not.ok;
    expect(logoutResult.fetching).to.be.ok;

    Promise.resolve()
      .then(() => {

        model.findById({ id: 'user1' })
          .then(() => {
            const findByIdResult = model.selectors.findById({ id: 'user1' });
            expect(findByIdResult.record).to.deep.equal(users[0]);
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.find(query1)
          .then(() => {
            const findResult = model.selectors.find(query1);
            expect(findResult.records.map(row => row.record)).to.deep.equal([users[1]]);
            expect(findResult.requested).to.be.ok;
            expect(findResult.requesting).to.be.not.ok;

            const findByIdResult = model.selectors.findById({ id: 'user2' });
            expect(findByIdResult.record).to.deep.equal(users[1]);
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.find(query2)
          .then(() => {
            const findResult = model.selectors.find(query2);
            expect(findResult.records.map(row => row.record)).to.deep.equal([users[2]]);
            expect(findResult.requested).to.be.ok;
            expect(findResult.requesting).to.be.not.ok;

            const findByIdResult = model.selectors.findById({ id: 'user3' });
            expect(findByIdResult.record).to.deep.equal(users[2]);
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.find()
          .then(() => {
            const findResult = model.selectors.find();
            expect(findResult.records.map(row => row.record)).to.deep.equal(users);
            expect(findResult.requested).to.be.ok;
            expect(findResult.requesting).to.be.not.ok;

            const findByIdResult = model.selectors.findById({ id: 'user4' });
            expect(findByIdResult.record).to.deep.equal(users[3]);
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.updateById({ id: 'user1', email: 'new@email.com' })
          .then(() => {
            const findByIdResult = model.selectors.findById({ id: 'user1' });
            expect(findByIdResult.record).to.deep.equal(users[0]);
            expect(findByIdResult.record.email).to.equal('new@email.com');
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.create({ email: 'blabla@email.com' })
          .then(() => {
            const findByIdResult = model.selectors.findById({ id: 'user5' });
            expect(findByIdResult.record).to.deep.equal(users[4]);
            expect(findByIdResult.record.email).to.equal('blabla@email.com');
            expect(findByIdResult.requested).to.be.ok;
            expect(findByIdResult.requesting).to.be.not.ok;
          });

      })
      .then(() => {

        return model.deleteById({ id: 'user2' })
          .then(() => {
            const findByIdResult = model.selectors.findById({ id: 'user2' });
            expect(findByIdResult.record).to.deep.equal({});
            expect(findByIdResult.requesting).to.be.ok;
          });

      })
      .then(() => {

        return model.find(query3)
          .then(() => {
            const findResult = model.selectors.find(query3);
            expect(findResult.params).to.deep.equal([query3]);
            expect(findResult.ids).to.deep.equal(['user5', 'user4', 'user3', 'user1']);
            expect(findResult.records.map(row => row.record)).to.deep.equal(users);
            expect(findResult.error).to.be.not.ok;
            expect(findResult.requesting).to.be.not.ok;
            expect(findResult.requested).to.be.ok;
          });

      })
      .then(() => {

        return model.findById({ id: 'user8' })
          .catch(() => {
            const findByIdResult = model.selectors.findById({ id: 'user8' });
            expect(findByIdResult.record).to.be.not.ok;
            expect(findByIdResult.error).to.deep.equal({ error: 'not found' });
            expect(findByIdResult.requesting).to.be.not.ok;
            expect(findByIdResult.requested).to.be.not.ok;
          });

      })
      .then(() => done())
      .catch(done);

  });

});