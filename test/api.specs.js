import { expect } from 'chai';
import api from '../src/helpers/api';

describe('API generator', () => {

  it('create api', (done) => {

    const params = {
      username: 'username',
      password: 'password'
    };

    const fetch = (path, options) => {
      expect(path).to.equal('/oauth/token');
      expect(options).to.have.property('method');
      expect(options.method).to.equal('post');
      expect(options).to.have.property('body');
      expect(options.body).to.deep.equal(params);
      return Promise.resolve();
    };

    const methods = api({
      fetch,
      methods: {
        getToken: {
          path: '/oauth/token',
          method: 'post'
        }
      }
    });

    expect(methods).to.be.an('object');
    expect(methods).to.have.property('getToken');
    expect(methods.getToken).to.be.a('function');

    methods.getToken(params)
      .then(() => done());

  });

  it('create api with base path', (done) => {

    const fetch = (path, options) => {
      expect(path).to.equal('/users/logout');
      expect(options).to.have.property('method');
      expect(options.method).to.equal('post');
      expect(options).to.not.have.property('body');
      return Promise.resolve();
    };

    const methods = api({
      fetch,
      basePath: '/users',
      methods: {
        logout: {
          path: '/logout',
          method: 'post'
        }
      }
    });

    expect(methods).to.be.an('object');
    expect(methods).to.have.property('logout');
    expect(methods.logout).to.be.a('function');

    methods.logout()
      .then(() => done());

  });

  it('create api with base path and absolute path', (done) => {

    const fetch = (path, options) => {
      expect(path).to.equal('/logout');
      expect(options).to.have.property('method');
      expect(options.method).to.equal('post');
      expect(options).to.not.have.property('body');
      return Promise.resolve();
    };

    const methods = api({
      fetch,
      basePath: '/users',
      methods: {
        logout: {
          path: '//logout',
          method: 'post'
        }
      }
    });

    expect(methods).to.be.an('object');
    expect(methods).to.have.property('logout');
    expect(methods.logout).to.be.a('function');

    methods.logout()
      .then(() => done());

  });
});