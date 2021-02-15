import React from 'react'
import { fetchGet } from './fetchJson'
import { fetchPost } from './fetchJson'
import { modelStore, primaryKeys } from './modelStore'

export { primaryKeys }

/**
 * Provides automatically updating data models.
 * @param {Object} endpoint An object contained in the `api` namespace.
 */
export function useModel(endpoint) {

  // Use the context from the modelStore
  const { state, dispatch } = React.useContext(modelStore)

  console.log(state)

  if (!state || !dispatch) {
    throw new Error('There must be an enclosing ModelStoreProvider to use useModel.')
  }

  if (!endpoint.execute) {
    throw new TypeError('You must provide an endpoint from the `api` namespace.')
  }

  if (!endpoint.table) {
    throw new TypeError(`Endpoint ${endpoint.apiPath} does not contain a 'table' property, so it cannot be used with useModel(). You can still call execute() on the endpoint directly.`)
  }

  if (!endpoint.params) {
    console.warn(`Endpoint ${endpoint.apiPath} does not contain a 'params' property, needed to cache requests. (If there are no params, assign an empty object {}.)`)
  }

  // If tryFilter is true, try the filter function first, and return if filtered has any data in it at all
  if (endpoint.tryFilter) {
    let filtered = endpoint.filter(state.model[endpoint.table])
    if (filtered) {
      if (!Array.isArray(filtered)) {
        return filtered
      } else if (filtered.length > 0) {
        return filtered
      }
    }
  }

  let signature = endpoint.apiPath + JSON.stringify(endpoint.params)
  console.log(`useModel(${signature}), status is ${state.signatureStatus[signature]}`)

  if (state.signatureStatus[signature] === 'complete') {
    // Use the filter function to return the appropriate data
    if (endpoint.filter) {
      console.log('Applying filter to ', state.model[endpoint.table])
      let filtered = endpoint.filter(state.model[endpoint.table])
      console.log(endpoint.filter)
      console.log('Result is ', filtered)
      return endpoint.filter(state.model[endpoint.table])
    } else {
      return state.model[endpoint.table].slice()
    }
  } else if (state.signatureStatus[signature] === 'pending') {
    // Hang tight, we've already requested this data
    return null
  } else {
    // dispatch cannot be called until this component has finished rendering
    setTimeout(() => {
      dispatch({ type: 'queueRequest', endpoint, signature })
    })

    return null
  }

}


/**
 * Provides api endpoints for retrieving or updating data.
 */
export const api = {

  users: {
    login: (username, password) => ({
      execute: () => fetchPost('/api/v4/user/login', { username, password })
    }),

    verify: () => ({
      execute: () => fetchGet('/api/v4/user/verify')
    }),

    all: () => ({
      params: {},
      table: 'user',
      execute: () => fetchGet('/api/v4/user/all')
    }),

    update: (user) => ({
      execute: () => fetchPost('/api/v4/user/update', user)
    }),

    create: (user) => ({
      execute: () => fetchPost('/api/v4/user/create', user)
    }),

    delete: (userId) => ({
      execute: () => fetchPost('/api/v4/user/delete', { userId })
    })
  },

  events: {
    all: () => ({
      params: {},
      table: 'event',
      execute: () => fetchGet('/api/v4/event/all')
    }),

    getById: (eventId) => ({
      params: { eventId },
      table: 'event',
      execute: () => fetchGet('/api/v4/event/get', { eventId })
    })
  },

  cars: {
    getByEventId: (eventId) => ({
      params: { eventId },
      table: 'car',
      execute: () => fetchGet('/api/v4/car/getByEventId', { eventId }),
      filter: (cars) => { console.log(eventId, cars); return cars.filter(car => { console.log(+eventId); console.log(car); return car.eventId === eventId }) }
    }),

    update: (car) => ({
      execute: () => fetchGet('/api/v4/car/update', { car })
    })
  },

  results: {
    getByEventId: (eventId) => ({
      params: { eventId },
      table: 'result',
      execute: () => fetchGet('/api/v4/result/getByEventId', { eventId }),
      filter: (results) => results.filter(result => result.eventId === eventId)
    })
  },

  /** API endpoints relating to orders. */
  __order: {

    /**
     * Retrieves orders for a customer.
     * @param {Object} params - The parameters to pass to the API endpoint.
    * @param {
    string
  } params.customer_id - The customer id.
     */
    get_for_customer: (params) => ({
      /** This tells useModel to subscribe to a particular table for socket updates, and specifies where to store the data returned from execute() in our local data model. */
      table: 'order',

      /** execute is used to make the actual request. It should return a Promise. */
      execute: () => fetchPost('/api/v1/order/get_for_customer', params),

      /** filter is used when the data we need is already present in our local model. The local data model specified in `table` will be passed as an argument. */
      filter: (orders) => orders.filter(order => order.customer_id === params.customer_id),

      /** Always include the original params used to make the request. This is used by useModel to determine whether an api call needs to be executed again. */
      params
    }),

    /**
     * Retrieves an order by id.
     * @param {Object} params - The parameters to pass to the API endpoint.
     * @param {string} params.id - The order id.
     */
    get: (params) => ({
      /** This tells useModel to subscribe to a particular table for socket updates, and specifies where to store the data returned from execute() in our local data model. */
      table: 'order',

      /** execute is used to make the actual request. It should return a Promise. */
      execute: () => fetchPost('/api/v1/order/get', params),

      /** filter is used when the data we need is already present in our local model. The local data model specified in `table` will be passed as an argument. */
      filter: (orders) => orders.find(order => order.id === params.id),

      /** If tryFilter is true, useModel will determine whether to make a request by applying the filter on the local data model and testing for a truthy value (or, in the case of an array, a non-zero length), rather than comparing params against previous requests. **This is particularly useful for apis that retrieve data by primary key**, where the presence of any match in the local data indicates we have the data. It should not be used when the return value from execute depends in an unpredictable way on the params.
      tryFilter: true,

      /** Always include the original params used to make the request. This is used by useModel to determine whether an api call needs to be executed again. */
      params
    }),

    /**
     * Updates an order.
     * @param {Object} params - The updated order.
     */
    update: (params) => ({
      execute: () => fetchPost('/api/v1/order/update', params)
    }),

    /**
     * Retrieve information from multiple tables which cannot be constructed locally because it uses JOINs or other db features.
     */
    retrieve_joined_information: (params) => ({
      execute: () => fetchPost('/api/v1/order/retrieve_joined_information', params)
    })

  }
}

// Add api paths and other metadata to each api endpoint
addApiPaths('api', api)

function addApiPaths(path, obj) {
  for (let key in obj) {
    let newPath = `${path}.${key}`
    if (typeof obj[key] === 'function') {
      let original = obj[key]
      if (!original().execute) {
        throw new Error(`Endpoint ${newPath} requires an execute function`)
      }
      if (typeof original().execute !== 'function') {
        throw new Error(`The execute property of endpoint ${newPath} is not a function`)
      }
      if (original().tryFilter && !original().filter) {
        throw new Error(`Endpoint ${newPath} has the tryFilter flag, but no filter function`)
      }
      obj[key] = (...args) => ({ ...original(...args), apiPath: newPath })
    } else {
      addApiPaths(newPath, obj[key])
    }
  }
}

