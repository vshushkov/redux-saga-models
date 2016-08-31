#redux-saga-models

Models layer backed with [redux-saga](https://www.npmjs.com/package/redux-saga). 

Library is **NOT** ready for production yet.

## Installation

    npm install --save redux-saga-models
    
## Features

* Sagas to handle dispatched actions
* Mixins (see example of mixin in `mininx/crud` and `test/crud.specs.js`)
* Grouping models (see `test/index.specs.js` -- `create models`)
* Dispatch actions from any place of application (thanks to [machadogj](https://github.com/machadogj) for idea)

## Simple usage

Defining a model:

##### **models/user.js**
```js
import { createModel } from 'redux-saga-models';

const user = createModel({
  name: 'user',
  methods: {
    login(username, password) {
      // async operation. something like this:
      // return fetch('/users/login', { username, password });
    },
    findById(id) {
      // async operation. something like this:
      // return fetch(`/users/${id}`);
    }
  }
});

export default user;
export const { reducer, sagas, selectors } = user;
```

And we create follwing artifacts:

`reducer` -- model's reducer.

`sagas` -- array of created sagas.

`selectors` -- methods that returns current model state. 
For example, after calling `user.findById('me')` you can receive data like this:

```js
const { result, fetching, fetched } = user.selectors.findById('me');
```

Using newly created model in submit handler:

##### **containers/LoginForm.js**
```js
import { connect } from 'react-redux';
import { put } from 'react-router-redux';
import LoginForm from '../components/LoginForm.js';
import user from '../models/user.js';

const mapDispatchToProps = (dispatch) => {
  onSubmit: ({ username, password }) => 
    user.login(username, password)
      .then(() => dispatch(put('/')))
};

const LoginFormContainer = connect(null, mapDispatchToProps)(LoginForm);
export default LoginFormContainer;
```

Also you can define custom reducer and selectors:

##### **models/user.js**

```js
const user = createModel({
  ...
  reducers: {
    login: (state, action) => {
      return !action.error && action.payload ? action.payload.token : null;
    }
  },

  selectors: {
    token() {
      return this.getModelState().login;
    }
  }
  ...
});
```

See more examples and configuration ways in tests.

## Roadmap

* Make a simpler interface for creating models
* Write README
* Add example projects
* Use isomorphic-fetch as default fetch in `helpers/api` and `mixins/crud`
* 100% tests code coverage
* ...

Work in progress...
