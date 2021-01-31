import React from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import { useAppState } from '../useAppState'
import './css/HomeView.css'

export function Race(props) {

  const { state, dispatch } = useAppState()


  const { data, connected, connecting, connect } = useBluetooth()


  return (
    <div className='homeView'>
      This is the race

      <br />

      {connected ? 'Connected' : 'Not connected'}
      {!connected && <button onClick={connect} disabled={connecting}>Connect to Track</button>}
      <br />
      Lane 1 <input value={data.lane1 ?? ''} readonly />
      <br />
      Lane 2 <input value={data.lane2 ?? ''} readonly />
      <br />
      Lane 3 <input value={data.lane3 ?? ''} readonly />
      <br />
      Lane 4 <input value={data.lane4 ?? ''} readonly />
      <br />
      Status <input value={data.status ?? ''} readonly />
      <br />
      Pin state <input value={data.pinState ?? ''} readonly />
      <br />
      FPS <input value={data.fps ?? ''} readonly />


    </div>
  )

}