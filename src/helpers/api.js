import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

const pathParamsPattern = new RegExp(':([a-z\-\d]+)', 'ig');

/**
 * @todo default values support
 *
 * @param {Object} params
 * @param {Object} method
 * @param {String} basePath
 * @return {String}
 */
function generateMethodPath(params = {}, method, basePath) {
  const path = method.path;
  let resultPath = path || '/';

  if (basePath && !resultPath.startsWith('//')) {
    resultPath = `${basePath}${resultPath === '/' ? '' : resultPath}`;
  } else if (resultPath.startsWith('//')) {
    resultPath = resultPath.substring(1);
  }

  Object.keys(params).forEach(name => {
    resultPath = resultPath.replace(`:${name}`, params[name]);
  });

  return resultPath ? (resultPath.startsWith('/') ? '' : '/') + resultPath : '/';
}

/**
 * @todo default values support
 *
 * @param {Object} params
 * @param {Object} method
 * @return {{method: String, body: Object?, query: Object?}}
 */
function generateMethodOptions(params = {}, method) {
  const path = method.path || '';
  const requestType = method.method || 'get';

  if (isEmpty(params)) {
    return { method: requestType };
  }

  let execResult;
  let pathParams = [];
  while ((execResult = pathParamsPattern.exec(path)) !== null) {
    pathParams.push(execResult[1]);
  }

  const resultParams = omit(params, pathParams);
  if (isEmpty(resultParams)) {
    return { method: requestType };
  }

  if (requestType === 'get') {
    return { method: requestType, query: resultParams };
  }

  return { method: requestType, body: resultParams };
}

/**
 *
 * @param params
 * @param method
 * @param basePath
 * @param fetch
 * @return {Function}
 */
function createResponseHandler({ params, method, basePath, fetch }) {
  return (response) => {
    if (method.response && typeof method.response.transform === 'function') {
      return method.response.transform(response);
    }

    if (method.response && method.response.after) {
      const afterParams = typeof method.response.afterParams === 'function' ?
        method.response.afterParams(params, response) : params;

      const path = generateMethodPath(afterParams || {}, method.response.after, basePath);
      const options = generateMethodOptions(afterParams || {}, method.response.after);
      return fetch(path, options)
        .then(createResponseHandler({
          params: afterParams,
          method: method.response.after,
          basePath, fetch
        }));
    }

    return response;
  }
}

export default function api({ basePath, methods, fetch }) {
  return Object.keys(methods)
    .reduce((api, methodName) => {
      const method = methods[methodName];

      const untitledMethod = (params) => {
        const path = generateMethodPath(params || {}, method, basePath);
        const options = generateMethodOptions(params || {}, method);

        return fetch(path, options)
          .then(createResponseHandler({ params, method, basePath, fetch }));
      };

      api[methodName] = new Function('method',
        `return function ${methodName}(params) { return method(params); };`
      )(untitledMethod);

      return api;
    }, {});
}