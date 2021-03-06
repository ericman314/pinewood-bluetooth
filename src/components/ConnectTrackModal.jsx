import { Button, Dialog, DialogActions, TextField } from '@material-ui/core'
import React from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import './css/ConnectTrackModal.css'


export function ConnectTrackModal() {

  const { connected, connecting, connect } = useBluetooth()

  function handleClose() {

  }

  return (

    <Dialog open={!connected} onClose={handleClose}>
      <div className='bluetoothStatus'>

        <h1>Connect to the track</h1>
        <h2 >
          {connected ? 'Connected' : (
            connecting ? 'Connecting, please wait...' : 'Not connected'
          )}
        </h2>
        <p>Click "CONNECT" below, then select <b>PinewoodDerbyTrack</b> in the list of devices and click "Pair".</p>

        <DialogActions classes={{ root: 'dialog-actions-centered' }}>
          <Button color='primary' onClick={connect} disabled={connecting}>Connect</Button>
        </DialogActions>
      </div>
    </Dialog>

  )

}