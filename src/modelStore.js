// store.js
import React, { createContext, useReducer } from 'react'
import update from 'immutability-helper'
import socketIOClient from 'socket.io-client'
import { fetchPost } from './fetchJson'
import config from './config'

const initialModel = {
  signatureStatus: {},
  model: {},
  subscribedTables: [],
  cacheStatus: {},
  socketConnected: false,
  requestQueue: []
}

export const primaryKeys = {
  event: 'eventId',
  car: 'carId',
  result: 'resultId',
  user: 'userId'
}

const socketClientLocation = config.webRoot
// const socket = socketIOClient(socketClientLocation)
let socket


/** A React context for storing our model */
const modelStore = createContext(initialModel)
const { Provider } = modelStore

/** Provides the model store to the component tree */
const ModelStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {

      case 'setSignatureStatus': {
        if (!action.signature) { throw new TypeError('action.signature is required') }
        if (!action.status) { throw new TypeError('action.status is required') }
        return update(state, { signatureStatus: { [action.signature]: { $set: action.status } } })
      }

      case 'queueRequest': {
        if (!action.signature) { throw new TypeError('action.signature is required') }
        if (!action.endpoint) { throw new TypeError('action.endpoint is required') }

        if (state.requestQueue.find(req => req.signature === action.signature)) {
          return state
        } else {
          console.log('Adding to request queue: ', action.signature)
          return update(state, { requestQueue: { $push: [{ signature: action.signature, endpoint: action.endpoint }] } })
        }
      }

      case 'dequeueRequest': {
        if (!action.signature) { throw new TypeError('action.signature is required') }
        let idx = state.requestQueue.findIndex(req => req.signature === action.signature)
        if (idx >= 0) {
          console.log('Removing from request queue: ', action.signature)
          return update(state, { requestQueue: { $splice: [[idx, 1]] } })
        } else {
          console.warn('Request not found in queue: ', action.signature)
          return state
        }
      }

      case 'setModel': {
        if (!action.table) { throw new TypeError('action.table is required') }
        if (!action.data) { throw new TypeError('action.data is required') }
        return update(state, { model: { [action.table]: { $set: action.data } } })
      }

      case 'updateModel': {

        if (!action.data) { throw new TypeError('action.data is required') }
        if (!action.table) { throw new TypeError('action.table is required') }

        let data = action.data
        let deleted = action.deleted
        let table = action.table
        let primaryKey = primaryKeys[table]
        if (!primaryKey) { throw new Error(`Table ${table} has no primaryKey`) }

        let stateUpdate = { model: {} }
        if (deleted) {
          let newArray = []
          for (let j in state.model[table]) {
            if (!data.ids.some(el => el === state.model[table][j][primaryKey])) {
              newArray.push(state.model[table][j])
            }
          }
          stateUpdate.model[table] = { $set: newArray }
        }
        else {
          if (state.model[table] === undefined) {

            let newArray = []
            for (let o of data) {
              newArray.push(o)
            }

            stateUpdate.model[table] = { $set: newArray }
          }
          else {
            // Copy new data to state, either by updating existing object or creating new one
            let toPush = []
            let toMerge = []
            for (let o of data) {
              let itemIndex = state.model[table].findIndex(el => el[primaryKey] === o[primaryKey])
              if (itemIndex < 0) {
                toPush.push(o)
              }
              else {
                toMerge.push({ index: itemIndex, obj: o })
              }
            }
            stateUpdate.model[table] = {}
            if (toPush.length > 0) {
              stateUpdate.model[table] = { $push: toPush }
            }
            for (let i in toMerge) {
              stateUpdate.model[table][toMerge[i].index] = { $merge: toMerge[i].obj }
            }
          }
        }
        console.log(stateUpdate)
        return update(state, stateUpdate)
      }

      case 'subscribe': {
        if (!action.table) { throw new TypeError('action.table is required') }
        if (state.subscribedTables.includes(action.table)) {
          return state
        } else {
          return update(state, { subscribedTables: { $push: [action.table] } })
        }
      }

      case 'socketConnect': {
        return update(state, { socketConnected: { $set: true } })
      }

      case 'socketDisconnect': {
        return update(state, { socketConnected: { $set: false } })
      }

      case 'initSocketSync': {

        if (!action.data) { throw new TypeError('action.data is required') }

        let cacheUpdateObj = {}
        for (let i in action.data) {
          let model = action.data[i].table
          cacheUpdateObj[model] = {
            table: action.data[i].table,
            timestamp: action.data[i].timestamp,
            serverUpdateCount: action.data[i].total_updates,
            updateCount: action.data[i].total_updates
          }
        }

        return update(state, { cacheStatus: { $set: cacheUpdateObj } })

      }

      case 'updateSocketSync': {
        if (!action.table) { throw new TypeError('action.table is required') }
        if (!action.timestamp) { throw new TypeError('action.timestamp is required') }
        if (!action.serverUpdateCount) { throw new TypeError('action.serverUpdateCount is required') }

        let model = action.table
        let syncUpdateObj = { cacheStatus: {} }
        if (typeof state.cacheStatus[model] === 'undefined') {
          syncUpdateObj.cacheStatus[model] = { $set: { table: model, timestamp: action.timestamp, serverUpdateCount: action.serverUpdateCount, updateCount: action.serverUpdateCount } }
        }
        else {
          syncUpdateObj.cacheStatus[model] = {
            updateCount: { $set: state.cacheStatus[model].updateCount + 1 },
            timestamp: { $set: action.timestamp },
            serverUpdateCount: { $set: action.serverUpdateCount }
          }
        }
        return update(state, syncUpdateObj)

      }

      default:
        throw new Error('Unrecognized action: ' + action.type)
    }
  }, initialModel)

  // Used to ensure that requests are not fired more than once
  const requestsFired = React.useRef([])

  React.useEffect(() => {

    state.requestQueue.forEach(req => {

      // Last chance to bail out if this request has already been made
      if (requestsFired.current.includes(req.signature)) {
        dispatch({ type: 'dequeueRequest', signature: req.signature })
        return
      }

      // Make the request
      requestsFired.current.push(req.signature)
      dispatch({ type: 'setSignatureStatus', signature: req.signature, status: 'pending' })
      dispatch({ type: 'subscribe', table: req.endpoint.table })

      req.endpoint.execute().then(response => {
        dispatch({ type: 'updateModel', table: req.endpoint.table, data: response })
        dispatch({ type: 'setSignatureStatus', signature: req.signature, status: 'complete' })
      })
      // TODO: Error handling
    })

  }, [state.requestQueue])

  React.useEffect(() => {

    (async () => {

      if (state.socketConnected && state.subscribedTables.length > 0) {

        console.log('In modelStore, socket is connected, and subscribedTables has items:', state.subscribedTables)

        let result = await fetchPost('/api/v1/auth_socket', { socket_id: socket.id, models: state.subscribedTables })
        if (result.error) {
          console.error(result.error)
        }
        else {
          console.log(result)

          dispatch({ type: 'initSocketSync', data: result })

          // TODO: Still unsure of the purpose for this below, will keep looking into it
          // // If reconnecting, just update the synch data so that we can determine whether we lost synch while disconnected
          // else {
          //   let cacheUpdateObj = {}
          //   for (let i in result) {
          //     let model = result[i].table
          //       cacheUpdateObj[model] = {
          //         timestamp: { $set: result[i].timestamp },
          //         serverUpdateCount: { $set: result[i].total_updates }
          //       }
          //   }

          //   dispatch({ type: 'DIRECT_UPDATE', data: { cacheStatus: cacheUpdateObj } })
          // }
        }
      }

    })()




  }, [state.subscribedTables, state.socketConnected])

  function dispatchData(obj, deleted) {
    console.log('dispatchData', obj, deleted)

    for (let i in obj.data) {
      let model = obj.data[i].model

      // Update synchronization state
      dispatch({ type: 'updateSocketSync', table: model, serverUpdateCount: obj.data[i].total_updates, timestamp: obj.data[i].timestamp })
      dispatch({ type: 'updateModel', table: model, data: obj.data[i], deleted })
    }
  }

  React.useEffect(() => {
    return

    console.log('Turning on socket listeners')
    socket.on('connect', async function () {
      dispatch({ type: 'socketConnect' })
    })

    socket.on('update', function (obj) {
      dispatchData(obj)
    })
    socket.on('create', function (obj) {
      dispatchData(obj)
    })
    socket.on('delete', function (obj) {
      dispatchData(obj, true)
    })
    socket.on('disconnect', function (obj) {
      console.log('SOCKET DISCONNECTED!')
    })

    return () => {
      console.log('Turning off socket listeners')
      socket.off('connect')
      socket.off('update')
      socket.off('create')
      socket.off('delete')
      socket.off('disconnect')
    }
  }, [])

  return <Provider value={{ state, dispatch }}>{children}</Provider>
}

export { modelStore, ModelStoreProvider }

