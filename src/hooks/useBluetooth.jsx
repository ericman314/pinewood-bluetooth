import { IsoTwoTone } from '@material-ui/icons'
import React from 'react'


/** A React context for storing the bluetooth state */
const context = React.createContext()

export function BluetoothProvider({ children }) {

  const [connected, setConnected] = React.useState(false)
  const [connecting, setConnecting] = React.useState(false)

  const [lane1, setLane1] = React.useState()
  const [lane2, setLane2] = React.useState()
  const [lane3, setLane3] = React.useState()
  const [lane4, setLane4] = React.useState()
  const [status, setStatus] = React.useState(1)
  const [pinStateBin, setPinStateBin] = React.useState()
  const [fps, setFps] = React.useState()

  const { on, removeListener, emit } = useEventEmitter()

  async function connect() {
    setConnecting(true)
    try {

      const device = await navigator.bluetooth.requestDevice({
        filters: [{
          services: ['ca3a80e0-c454-4fcb-b3cd-94070115afb2']
        }]
      })

      console.log('Found device:')
      console.log(device)

      device.addEventListener('gattserverdisconnected', evt => {
        setConnected(false)
        emit('disconnect')
      })

      const server = await device.gatt.connect()

      console.log('Connected to server:')
      console.log(server)

      const service = await server.getPrimaryService('ca3a80e0-c454-4fcb-b3cd-94070115afb2')

      console.log('Retrieved service:')
      console.log(service)

      const refCharLane1 = await service.getCharacteristic('ca3a80e1-c454-4fcb-b3cd-94070115afb2')
      const refCharLane2 = await service.getCharacteristic('ca3a80e2-c454-4fcb-b3cd-94070115afb2')
      const refCharLane3 = await service.getCharacteristic('ca3a80e3-c454-4fcb-b3cd-94070115afb2')
      const refCharLane4 = await service.getCharacteristic('ca3a80e4-c454-4fcb-b3cd-94070115afb2')
      const refCharStatus = await service.getCharacteristic('ca3a80e5-c454-4fcb-b3cd-94070115afb2')
      const refCharPinState = await service.getCharacteristic('ca3a80e6-c454-4fcb-b3cd-94070115afb2')
      const refCharFps = await service.getCharacteristic('ca3a80e7-c454-4fcb-b3cd-94070115afb2')

      refCharLane1.startNotifications()
      refCharLane2.startNotifications()
      refCharLane3.startNotifications()
      refCharLane4.startNotifications()
      refCharStatus.startNotifications()
      refCharPinState.startNotifications()
      refCharFps.startNotifications()

      refCharLane1.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint32(0, true)
        setLane1(val)
        emit('data', { name: 'lane1', value: val })
      })
      refCharLane2.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint32(0, true)
        setLane2(val)
        emit('data', { name: 'lane2', value: val })
      })
      refCharLane3.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint32(0, true)
        setLane3(val)
        emit('data', { name: 'lane3', value: val })
      })
      refCharLane4.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint32(0, true)
        setLane4(val)
        emit('data', { name: 'lane4', value: val })
      })
      refCharStatus.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint8(0)
        setStatus(val)
        emit('data', { name: 'status', value: val })
      })
      refCharPinState.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint8(0)
        setPinStateBin(val)
        emit('data', { name: 'pinState', value: val })
      })

      refCharFps.addEventListener('characteristicvaluechanged', evt => {
        let val = evt.target.value.getUint32(0, true)
        setFps(val)
        emit('data', { name: 'fps', value: val })
      })

      refCharLane1.readValue().then(val => setLane1(val.getUint32(0, true)))
      refCharLane2.readValue().then(val => setLane2(val.getUint32(0, true)))
      refCharLane3.readValue().then(val => setLane3(val.getUint32(0, true)))
      refCharLane4.readValue().then(val => setLane4(val.getUint32(0, true)))
      refCharStatus.readValue().then(val => setStatus(val.getUint8(0)))
      refCharPinState.readValue().then(val => setPinStateBin(val.getUint8(0)))
      refCharFps.readValue().then(val => setFps(val.getUint32(0, true)))

      console.log('Connection established')
      setConnected(true)
      emit('connect')

    } catch (ex) {
      console.error(ex)
    } finally {
      setConnecting(false)
    }

  }

  // Begin at index 1
  const lanes = [lane1, lane2, lane3, lane4]
  const pinStates = [pinStateBin & 0x01, pinStateBin & 0x02, pinStateBin & 0x04, pinStateBin & 0x08]
  const gate = status ? 'DOWN' : 'UP'

  return <context.Provider
    value={{
      connect,
      connected,
      connecting,
      data: connected ? { lanes, lane1, lane2, lane3, lane4, gate, pinStates, pinStateBin, fps } : {},
    }}>{children}
  </context.Provider>
}

export function useBluetooth() {
  return React.useContext(context)
  // if (!context.state || !context.dispatch) {
  //   throw new Error('There must be an enclosing BluetoothProvider to use useBluetooth.')
  // }
}

function useEventEmitter() {

  const [events, setEvents] = React.useState({ data: [], connect: [], disconnect: [], connecting: [] })

  /**
   * Register an event listener
   * @param {'data'|'connect'|'connecting'|'disconnect'} name 
   * @param {function} listener 
   */
  function on(name, listener) {
    if (!events[name]) {
      setEvents({ ...events, [name]: [listener] })
    } else {
      setEvents({ ...events, [name]: [...events[name], listener] })
    }
  }

  /**
   * Remove an event listener
   * @param {string} name 
   * @param {function} listenerToRemove 
   */
  function removeListener(name, listenerToRemove) {
    if (!events[name]) {
      throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`)
    }

    const filterListeners = (listener) => listener !== listenerToRemove
    setEvents({ ...events, [name]: events[name].filter(filterListeners) })
  }

  /**
   * Remove all event listeners for the given event
   * @param {string} name 
   */
  function removeAllListeners(name) {
    setEvents({ ...events, [name]: [] })
  }

  function emit(name, data) {
    if (!events[name]) {
      throw new Error(`Can't emit an event. Event "${name}" doesn't exits.`)
    }

    const fireCallbacks = (callback) => {
      callback(data)
    }

    events[name].forEach(fireCallbacks)
  }

  return { on, removeListener, emit }
}