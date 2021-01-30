import { Grid } from '@material-ui/core'
import React from 'react'
import { useAppState } from '../useAppState'
import './css/HomeView.css'
import { HomeCardLink } from './HomeCardLink'

export function HomeView(props) {

  const { state, dispatch } = useAppState()

  const [lane1, setLane1] = React.useState()
  const [lane2, setLane2] = React.useState()
  const [lane3, setLane3] = React.useState()
  const [lane4, setLane4] = React.useState()
  const [status, setStatus] = React.useState()
  const [pinState, setPinState] = React.useState()


  const refCharLane1 = React.useRef()
  const refCharLane2 = React.useRef()
  const refCharLane3 = React.useRef()
  const refCharLane4 = React.useRef()
  const refCharStatus = React.useRef()
  const refCharPinState = React.useRef()

  async function handleConnectTrackClick() {

    try {
      let device = await navigator.bluetooth.requestDevice({
        filters: [{
          services: ['ca3a80e0-c454-4fcb-b3cd-94070115afb2']
        }]
      })

      console.log(device)

      let server = await device.gatt.connect()

      console.log(server)

      let service = await server.getPrimaryService('ca3a80e0-c454-4fcb-b3cd-94070115afb2')

      console.log(service)

      refCharLane1.current = await service.getCharacteristic('ca3a80e1-c454-4fcb-b3cd-94070115afb2')
      refCharLane2.current = await service.getCharacteristic('ca3a80e2-c454-4fcb-b3cd-94070115afb2')
      refCharLane3.current = await service.getCharacteristic('ca3a80e3-c454-4fcb-b3cd-94070115afb2')
      refCharLane4.current = await service.getCharacteristic('ca3a80e4-c454-4fcb-b3cd-94070115afb2')
      refCharStatus.current = await service.getCharacteristic('ca3a80e5-c454-4fcb-b3cd-94070115afb2')
      refCharPinState.current = await service.getCharacteristic('ca3a80e6-c454-4fcb-b3cd-94070115afb2')

      refCharLane1.current.startNotifications()
      refCharLane2.current.startNotifications()
      refCharLane3.current.startNotifications()
      refCharLane4.current.startNotifications()
      refCharStatus.current.startNotifications()
      refCharPinState.current.startNotifications()

      refCharLane1.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setLane1(evt.target.value.getUint32(0, true)) })
      refCharLane2.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setLane2(evt.target.value.getUint32(0, true)) })
      refCharLane3.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setLane3(evt.target.value.getUint32(0, true)) })
      refCharLane4.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setLane4(evt.target.value.getUint32(0, true)) })
      refCharStatus.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setStatus(evt.target.value.getUint8(0)) })
      refCharPinState.current.addEventListener('characteristicvaluechanged', evt => { console.log(evt); setPinState(evt.target.value.getUint8(0)) })

      refCharLane1.current.readValue().then(val => setLane1(val.getUint32(0, true)))
      refCharLane2.current.readValue().then(val => setLane2(val.getUint32(0, true)))
      refCharLane3.current.readValue().then(val => setLane3(val.getUint32(0, true)))
      refCharLane4.current.readValue().then(val => setLane4(val.getUint32(0, true)))
      refCharStatus.current.readValue().then(val => setStatus(val.getUint8(0)))
      refCharPinState.current.readValue().then(val => setPinState(val.getUint8(0)))


      // console.log(characteristic)

      // let value = Uint8Array.of(0)
      // let result = await characteristic.writeValue(value)

      // console.log(result)

    } catch (ex) {
      console.error(ex)
    }

  }


  async function handleStartingGate(val) {
    let value = Uint8Array.of(val)
    let result = await refCharStatus.current.writeValue(value)
  }

  async function handleLane(lane, val) {
    let char
    switch (lane) {
      case 1: char = refCharLane1.current; break
      case 2: char = refCharLane2.current; break
      case 3: char = refCharLane3.current; break
      case 4: char = refCharLane4.current; break
    }
    let value = Uint32Array.of(val)
    await char.writeValue(value)
  }


  return (
    <div className='homeView'>
      <Grid container>
        <HomeCardLink title='Events' caption='View event details, add cars, run a race' to='/events-list' />
        <HomeCardLink title='Race Now' caption='Run an unmanaged race' to='/race-unmanaged' />
        {state.user?.admin === 1 &&
          <HomeCardLink title='Users' caption='View and manage users' to='/users' />
        }
      </Grid>

      <button onClick={handleConnectTrackClick}>Connect to Track</button>
      {/* <br /> */}
      {/* {!status && <button onClick={() => handleStartingGate(1)}>Release starting gate</button>} */}
      {/* {!!status && <button onClick={() => handleStartingGate(0)}>Raise starting gate</button>} */}
      <br />
      Lane 1 <input value={lane1} readonly />
      <br />
      Lane 2 <input value={lane2} readonly />
      <br />
      Lane 3 <input value={lane3} readonly />
      <br />
      Lane 4 <input value={lane4} readonly />
      <br />
      Status <input value={status} readonly />
      <br />
      Pin state <input value={pinState} readonly />


    </div>
  )

}