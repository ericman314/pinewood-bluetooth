import React, { useDebugValue } from 'react'

/**
 * Combined useState and useRef implementation.
 * @param {*} initialState 
 */
export function useStateRef(initialState) {

  const [state, setState] = React.useState(initialState)
  const ref = React.useRef(initialState)
  React.useEffect(() => { ref.current = state }, [state])
  useDebugValue(state)
  return [state, setState, ref]
}