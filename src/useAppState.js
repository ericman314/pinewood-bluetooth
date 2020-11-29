// state.js
import React, { createContext, useReducer } from 'react'
import update from 'immutability-helper'
import constants from './constants'

const initialState = {
}

/** A React context for storing our state */
const state = createContext(initialState)
const { Provider } = state

/** Provides the state to the component tree */
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {

      case constants.ACTION_USER_IS_LOGGED_IN: {
        if (!action.user) throw new TypeError('action.user is required')
        return update(state, {
          user: { $set: action.user }
        })
      }

      case constants.ACTION_LOGOUT_USER: {
        return update(state, {
          user: { $set: null },
        })
      }

      default:
        throw new Error('Unrecognized action: ' + action.type)
    }
  }, initialState)

  return <Provider value={{ state, dispatch }}>{children}</Provider>
}

export function useAppState() {
  let context = React.useContext(state)
  if (!context.state || !context.dispatch) {
    throw new Error('There must be an enclosing AppStateProvider to use useAppState.')
  }
  return context
}
