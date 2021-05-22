import { Button, Grid, Menu, MenuItem } from '@material-ui/core'
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state'
import React, { useReducer } from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import { useAppState } from '../useAppState'
import { api, useModel } from '../useModel'
import { ConnectTrackModal } from './ConnectTrackModal'
import './css/HomeView.css'
import update from 'immutability-helper'
import moment from 'moment'
import { useStateRef } from '../hooks/useStateRef'
import noneCar from '../cars/none.jpg'

function useStateWithLabel(initialValue, name) {
  const [value, setValue] = React.useState(initialValue)
  React.useDebugValue(`${name}: ${JSON.stringify(value)}`)
  return [value, setValue]
}

/**
 * Strategy for state management:
 *
 * All of the state will be contained in a reducer. The reducer actions will represent changes in the race state.
 * Initialize the reducer with the cars, event, and results. We will update the cars and results locally in our reducer,
 * while at the same time updating them on the server.
 *
 * I have yet to decide whether we will update the results imperatively at the same moment we dispatch the reducer
 * actions, or in response to changes in our reducer state. That will depend on whether or not we can compute changes in
 * state outside of the reducer.
 */


export function Race({ cars: _cars, event: _event, results: _results }) {
  console.log({ cars: _cars, event: _event, results: _results })

  const { state, dispatch } = useAppState()


  const { data, connected, connecting, connect } = useBluetooth()

  /** All of the lanes */
  const allLanes = [1, 2, 3, 4]

  /** All lanes which are operational */
  const lanes = [1, 2, 3, 4]

  const laneColors = { 1: 'Blue', 2: 'Yellow', 3: 'Green', 4: 'Red' }

  const numberOfLanes = allLanes.length

  const refHandleTick = React.useRef(null)
  /*
* cars: _cars, // initialized from the cars data model, it will be updated regularly
* event: _event, // initialized from the event data model. Not likely to be updated very often
* results: _results, // initialized from the result data model. It will be updated regularly.
* racingLane: [], // carId's of the cars currently racing
* onDeckLane: [], // carId's of the cars on deck
* status: 'READY', // controls what information is visible on the screen, and how we respond to triggers from the arduino
* standingsThisRace: [], // stores information about the results of the current race: which cars finished when, etc
* standings: [], // used to display standings of the entire event after each race
* animateRacing: false, // used to animate
* animateOnDeckMoveUp: false, // used to animate
* animateOnDeckAppear: false, // used to animate
* raceTimes: lanes.map(() => 0), // stores times from the current race (seems redundant with standingsThisRace)
* currentTime: 0, // the current time, used to display the time on the screen during the race
* gateReleaseTime: 0, // the time the gate was released
* arduinoReady: false, // the state of the arduino. Starts as false so that the race does not begin as soon as the component mounts if the gate is still down.
* weAreReady: false, // whether enough time has elapsed after the last race so that we are ready for the next one
* achievementsThisRace: [], // used to display achievements on the screen after each race
*/

/*
  * RACE PROCEDURE
  *
  * When the component mounts, cars, event, and results will be initialized from the data models. The status is
  * initialized to 'READY'.
  *
  * On first render, an effect runs to initialize state variables with their starting values. The effect also dispatches
  * 'moveToNextRun' twice. This fills racingLane and onDeckLane with ids of the cars. The action depends on having
  * up-to-date results for each car--this fact will be important later.
  *
  * When the gate is released, an effect runs which starts the video recording. It also dispatches 'startRace'--this
  * action changes the status to 'RACING', sets gateReleaseTime, and sets arduinoReady and weAreReady to false.
  *
  * When a car crosses the finish line, an effect runs which dispatches the 'trigger' action. This action sets
  * raceTime[action.lane] and pushes an item in standingsThisRace. TODO: Should this also update the results? Yes, I
  * believe so. Updating the results during the trigger action will ensure that all results are available once the race
  * has ended--for as you will see below, the race is not stopped until all results have been recorded in
  * standingsThisRace. Although results may be redundant with standingsThisRace, for legacy reasons we will keep it, but
  * it should be updated at the same time.
  *
  * On an interval, the 'setCurrentTime' action is dispatched. This sets the currentTime, which in turn causes an effect
  * to run. ...
  *
  * Current implementation: ...In the currentTime effect, if six seconds have elapsed since the gate release time, or
  * there are four items in standingsThisRace (meaning each car has finished), the race is stopped.
  *
  * Proposed change: ...In the currentTime effect, if six seconds have elapsed since the gate release time, the
  * 'assignDnf' action is dispatched to assign a time of 10 in results, raceTimes, and standingsThisRace for cars that
  * did not finish. The race is not stopped yet. Also in the currentTime effect, once standingsThisRace contains four
  * items, the 'awardAchievements' action is then dispatched. The race is still not stopped yet. Then, on the next tick,
  * and only after the state has been updated with the DNF results and achievements, the race is stopped. This ensures
  * that the current state will contain all of the results and achievements when we make web requests to save
  * everything.
  *
  * When the race is stopped, the video stops recording and the instant replay is shown. Results and achievements
  * are saved on the server. 'stopRace' is then dispatched, which sets the status to 'ENDED'. Two more actions are dispatched
  * after a delay. 'addStanding' is dispatched in intervals to create an animation effect, and 'setWeAreReady' is
  * dispatched after eight seconds, setting weAreReady to true.
  *
  * When the gate is reset, an action is dispatched to set arduinoReady to true.
  *
  * During the currentTime effect, we also check if the race has ended and arduinoReady and weAreReady are true. If so,
  * we reset the video and dispatch three actions: 'readyForStart1' and 'moveToNextRun' immediately, and
  * 'readyForStart2' after a delay. You already know what 'moveToNextRun' does, and that it relies on up-to-date
  * results. The other two actions reset the status to 'READY', reset the standings, and update animation state.
  *
  *
  */


  const [raceState, raceDispatch] = useReducer((state, action) => {
    switch (action.type) {

      /**
       * moveToNextRun: Move the on deck cars into now racing, and those new cars for on deck. If noOverride is set, no
       * changes will be made if any cars are currently in now racing. 
       */
      case 'moveToNextRun': {

        if (action.noOverride && state.racingLane.find(id => id)) {
          return state
        }

        // Properties of the cars that are updated are:
        // racingLane
        // onDeckLane
        let racingLaneNew = [...state.racingLane]
        let onDeckLaneNew = [...state.onDeckLane]


        // Move each of the cars on deck to racing    
        for (let i = 0; i < numberOfLanes; i++) {
          racingLaneNew[i] = onDeckLaneNew[i]
          onDeckLaneNew[i] = 0
        }

        // Calculate next cars to be on deck

        // This formula is deterministic so that the race order will be the same if the page is refreshed
        for (let i of lanes) {
          // Calculate a score for each car on this lane
          let bestScore = null, bestCar = null

          for (const car of state.cars) {
            let results = getResultsByCar(car)
            let score = 0
            let isCarCurrentlyRacing = racingLaneNew.includes(car.carId)
            let isCarCurrentlyOnDeck = onDeckLaneNew.includes(car.carId)
            // Cars should run once on each lane before twice on any lane, and so on.
            // Has this car run on this lane enough times yet?
            if (results.filter(e => e.lane === i).length * numberOfLanes > results.length + (isCarCurrentlyRacing ? 1 : 0)) {
              score += 1e12
            }

            // Has this car run enough times yet, including the currently scheduled race?
            if (results.filter(e => e).length + (isCarCurrentlyRacing ? 1 : 0) >= _event.multiplier) {
              score += 1e12
            }

            // How many times has the car raced?
            score += results.filter(e => e).length * 1e4

            // How many times has this car ran on this lane?
            score += results.filter(e => e.lane === i).length * 1e5

            // Is it racing right now on this lane?
            if (racingLaneNew[i] === car.carId) {
              score += 1e12
            }

            // Is it racing right now on any lane?
            if (isCarCurrentlyRacing) {
              score += 1e4
            }

            // Has it already been scheduled for the next race?
            if (isCarCurrentlyOnDeck) {
              score += 1e12
            }

            // Is the car deferred?
            if (car.deferPerm) {
              score += 1e12
            }

            // Subtract the car's best time
            var times = results.filter(e => e).map(e => e.time)
            if (times.length) {
              score -= Math.min.apply(null, times)
            }

            if (score < 9e11 && (score < bestScore || bestScore === null)) {
              bestScore = score
              bestCar = car
            }
          }

          if (bestCar) {
            onDeckLaneNew[i] = bestCar.carId
          }
        }


        return update(state, {
          racingLane: { $set: racingLaneNew },
          onDeckLane: { $set: onDeckLaneNew }
        })
      }

      /**
       * startRace: Should be called when a race begins. Sets status and gate release time.
       */
      case 'startRace': {
        console.log('Starting race')
        return update(state, {
          status: { $set: 'RACING' },
          gateReleaseTime: { $set: action.time },
          arduinoReady: { $set: false },
          weAreReady: { $set: false },
        })
      }

      /**
       * arduinoReady: Called when the arduino is ready.
       */
      case 'arduinoReady': {
        console.log('Arduino is ready')
        return update(state, {
          arduinoReady: { $set: true }
        })
      }

      /**
       * trigger: Occurs when the breakbeam sensor is triggered on a lane--does not result in a state change if the
       * lane was already triggered
       */
      case 'trigger': {
        // Only change the state if the lane has not already been triggered
        if (state.raceTimes[action.lane] === 0) {
          // TODO: Is it okay to refer to getRacing here?
          var place = state.standingsThisRace.length + 1

          // TODO: Also update results here

          return update(state, {
            raceTimes: { [action.lane]: { $set: action.time } },
            standingsThisRace: {
              $push: [{
                car: getRacing(action.lane),
                place,
                name: getRacingName(action.lane, { colorIfUnassigned: true }),
                time: action.time,
                deltaTime: state.standingsThisRace.length > 0 ? action.time - state.standingsThisRace[0].time : 0,
                lane: action.lane
              }]
            }

          })
        } else {
          return state
        }
      }

      /**
       * initialize: Called at the very beginning to initialize the state.
       */
      case 'initialize': {
        return update(state, {
          status: { $set: 'READY' },
          standingsThisRace: { $set: [] },
          standings: { $set: [] },
          animateRacing: { $set: false },
          animateOnDeckMoveUp: { $set: false },
          animateOnDeckAppear: { $set: false },
          raceTimes: { $set: allLanes.map(() => 0) },
          achievementsThisRace: { $set: null }
        })
      }

      /**
       * deferTemporarily: Swap the car racing in the given lane with the car on deck
       */
      case 'deferTemporarily': {
        return update(state, {
          racingLane: { [action.lane]: { $set: state.onDeckLane[action.lane] } },
          onDeckLane: { [action.lane]: { $set: state.racingLane[action.lane] } },
        })
      }

      case 'assignDnf': {
        const stateUpdateObject = {
          standingsThisRace: { $push: [] },
          raceTimes: {},
        }

        // TODO: Make this suitable for a pure function
        // Loop through each lane. If the lane has a car assigned to it, and the raceTime is 0, it means the car didn't finish. Give it a time of 10 seconds to represent DNF

        // TODO: Also update results
        // Each DNF car will have the same place
        var place = state.standingsThisRace.length + 1

        lanes.forEach(lane => {

          if (state.raceTimes[lane] === 0) {

            if (getRacing(lane)) {
              // saveResult(getRacing(lane), lane, 10, place, new Date(gateReleaseTime))
              stateUpdateObject.raceTimes[lane] = { $set: 10.0 } // Represents DNF
            }
            stateUpdateObject.standingsThisRace.$push.push({
              car: getRacing(lane),
              place: place,
              name: getRacingName(lane, { colorIfUnassigned: true }),
              time: 10,
              // deltaTime: $scope.standingsThisRace.length > 0 ? data.time - $scope.standingsThisRace[0].time : 0,
              lane: lane
            })
          }
        })
        return update(state, stateUpdateObject)
      }

      case 'awardAchievements': {
        // The race just ended. Each car contains all results up to this moment.
        let newAchievementsThisRace = []

        // Make sure standings are sorted (in case serial port is not so serial??)

        let standingSorted = state.standingsThisRace.slice()
        standingSorted.sort((a, b) => a.time > b.time ? 1 : -1)

        lanes.forEach(lane => {
          var ach = []

          // TODO: I would prefer to do this without using the 'car' intermediate object
          var car = getRacing(lane)
          if (!car) {
            // No car assigned to this lane
            return
          }
          var results = getResultsByCar(car)
          var result = results[0] // Results are sorted in reverse chronological order, so [0] is the most recent

          if (!result) {
            // Car has no results (probably has not finished any races yet)
            return
          }

          // Was this race this car's last?
          var isLastRace = results.length === _event.multiplier

          // Transcendent car: Have a time of 2.718xxx (e): Will almost never happen
          if (result.time.toFixed(6).startsWith('2.718')) {
            ach.push('e-Car')
          }

          // Fred Flintstone: Have a time over 4.00: 0.5% of cars
          if (result.time >= 4.0 && result.time < 10.0) {
            ach.push('Off-Road Vehicle')
          }

          // Well-rounded car: Have a time of 3.14xxxx (pi): 1% of cars
          if (result.time.toFixed(6).startsWith('3.14')) {
            ach.push('pi-Car')
          }

          if (result.time.toFixed(6).startsWith('3.0000')) {
            ach.push('Exactly 3 Seconds')
          }

          if (result.time.toFixed(6).startsWith('4.0000')) {
            ach.push('Exactly 4 Seconds')
          }

          // Top 1%: Have a time under 2.75: 1% of cars       
          if (result.time <= 2.75) {
            ach.push('Top 1%')
          }

          // Top 5%: Have a time under 2.775: 5% of cars       
          if (result.time <= 2.775) {
            ach.push('Top 5%')
          }

          // Top 1%: Have a time under 2.794: 10% of cars       
          if (result.time <= 2.794) {
            ach.push('Top 10%')
          }

          // Fuel-efficient vehicle: Have a time over 3.5: 2.8% of cars
          if (result.time >= 3.5 && result.time < 4.0) {
            ach.push('Fuel-Efficient Vehicle')
          }

          // By a Nose: Win a single race by 0.01s: 13% of cars
          if (result.place === 1 && standingSorted.length > 1 && standingSorted[1].time - standingSorted[0].time < 0.01) {
            ach.push('By a Nose')
          }

          // Photo Finish: Finish a race within 0.001s of another racer: 7% of cars
          if ((result.place > 1 && result.time - standingSorted[result.place - 2].time < 0.001
            ||
            result.place < standingSorted.length && standingSorted[result.place].time - result.time < 0.001)
            && result.time < 10) {
            ach.push('Photo Finish')
          }

          // The Come-back Kid: Finish last, then finish first: 10% of cars
          if (result.place === 1) {
            // Is a previous result last place?
            for (var j = 0; j < results.length - 1; j++) {
              if (results[j].place === lanes.length) {
                ach.push('Come From Behind')
                break
              }
            }
          }

          // The Runner-Up: Finish 2nd in each race: 2% of cars
          if (isLastRace) {
            var fails = 0
            for (var j = 0; j < results.length; j++) {
              if (results[j].place !== 2) {
                fails++
              }
            }
            if (fails <= 0) {
              ach.push('Second Every Time')
            }
          }

          // Finely tuned: Finish all races within 0.02 s: 19% of cars
          if (isLastRace) {
            var minTime = 99
            var maxTime = 0
            for (var m = 0; m < results.length; m++) {
              minTime = Math.min(results[m].time, minTime)
              maxTime = Math.max(results[m].time, maxTime)
            }
            if (maxTime - minTime < 0.02) {
              ach.push('Steady Racer')
            }
          }

          // Cutting Edge: Improve your time in each race: 12% of cars
          if (isLastRace) {
            var fail = false
            for (var m = 0; m < results.length - 1; m++) {
              if (results[m].time > results[m + 1].time) {
                fail = true
              }
            }
            if (!fail) {
              ach.push('Faster Each Race')
            }
          }

          // Strong Finisher: Have your best time on your final race: 30% of cars
          if (isLastRace) {
            var minTime = 99
            var maxTime = 0
            for (var m = 0; m < results.length; m++) {
              minTime = Math.min(results[m].time, minTime)
              maxTime = Math.max(results[m].time, maxTime)
            }
            if (result.time === minTime) {
              ach.push('Fastest Last')
            }
          }

          // Wild Car: Achieve a spread of times greater than half of a second
          var minTime = 99
          var maxTime = 0
          for (var m = 0; m < results.length; m++) {
            if (results[m].time < 10) {
              minTime = Math.min(results[m].time, minTime)
              maxTime = Math.max(results[m].time, maxTime)
            }
          }
          if (maxTime - minTime > 0.5) {
            ach.push('Unpredictable')
          }


          // car earned ach achievements. Remove ones the car has already earned.
          // car.achievements = car.achievements || []

          ach = ach.filter(a => !car.achievements.includes(a))

          // car.achievements = car.achievements.concat(ach)

          newAchievementsThisRace[lane] = ach

          console.log(car.carName + " has new achievements: " + ach.join(',') + "; all achievements are: " + car.achievements.join(','))

          // TODO: Save the achievements for this race
        })
        return update(state, {
          achievementsThisRace: { $set: newAchievementsThisRace }
        })
      }


      /**
       * stopRace: Ends the race
       */
      case 'stopRace': {
        const stateUpdateObject = {
          status: { $set: 'ENDED' },
        }
        return update(state, stateUpdateObject)
      }

      /**
       * setWeAreReady: Indicates that we are ready for the next race.
       */
      case 'setWeAreReady': {
        return update(state, {
          weAreReady: { $set: true }
        })
      }

      /**
       * addStanding: And an entry to the standings list. By calling this repeatedly, an animation can be effected.
       */
      case 'addStanding': {
        if (state.status === 'ENDED') {
          // Only add a standing if the race is still ended
          return update(state, {
            standingsThisRace: { $push: [action.standing] }
          })
        } else {
          // If the gate has already been reset, do not add the standing
          return state
        }
      }

      /**
       * readyForStart1: Begin an animation, and reset standings
       */
      case 'readyForStart1': {
        return update(state, {
          status: { $set: 'READY' },
          animateRacing: { $set: false },
          animateOnDeckMoveUp: { $set: false },
          animateOnDeckAppear: { $set: true },
          standingsThisRace: { $set: [] },
          standings: { $set: [] },
          achievementsThisRace: { $set: null }
        })
      }

      /**
       * readyForStart2: End the animation, and reset race times
       */
      case 'readyForStart2': {
        return update(state, {
          animateOnDeckAppear: { $set: false },
          raceTimes: { $set: allLanes.map(() => 0) }
        })
      }

      /**
       * setCurrentTime: Set the current race time displayed on the screen
       */
      case 'setCurrentTime': {
        return update(state, {
          currentTime: { $set: action.time }
        })
      }

      default: throw new Error('Unrecognized action: ' + action.type)

    }

  }, {
      cars: _cars, // initialized from the cars data model, it will be updated regularly
      event: _event, // initialized from the event data model. Not likely to be updated very often
      results: _results, // initialized from the result data model. It will be updated regularly.
    racingLane: [], // carId's of the cars currently racing
      onDeckLane: [], // carId's of the cars on deck
      status: 'READY', // controls what information is visible on the screen, and how we respond to triggers from the arduino
      standingsThisRace: [], // stores information about the results of the current race: which cars finished when, etc
      standings: [], // used to display standings of the entire event after each race
      animateRacing: false, // used to animate
      animateOnDeckMoveUp: false, // used to animate
      animateOnDeckAppear: false, // used to animate
      raceTimes: lanes.map(() => 0), // stores times from the current race (seems redundant with standingsThisRace)
      currentTime: 0, // the current time, used to display the time on the screen during the race
      gateReleaseTime: 0, // the time the gate was released
      arduinoReady: false, // the state of the arduino
      weAreReady: false, // whether enough time has elapsed after the last race so that we are ready for the next one
      achievementsThisRace: null, // used to display achievements on the screen after each race. Also acts as the signal that we are ready to stop the race and save the results.
  })

  React.useEffect(() => {
    console.log('initialize')

    // It takes two loops through moveToNextRun to get the cars into the racing position.
    for (var iter = 0; iter < 2; iter++) {
      // Do not move cars if any are already in racing position.
      raceDispatch({ type: 'moveToNextRun', noOverride: true })
    }

    broadcast('initializeInstantReplayStream')

    // Reset everything
    raceDispatch({ type: 'initialize' })

  }, [])

  React.useEffect(() => {
    if (data.gate === 'DOWN' && raceState.status === 'READY' && raceState.arduinoReady) {
      raceDispatch({ type: 'startRace', time: Date.now() })
      broadcast('showVideo')
      broadcast('startRecording')
      refHandleTick.current = setInterval(tick, 52)
    } else if (data.gate === 'UP' && !raceState.arduinoReady) {
      raceDispatch({ type: 'arduinoReady' })
    }
  }, [data.gate, raceState.status, tick, raceState.arduinoReady])

  React.useEffect(() => {
    trigger(1, data.lane1 / 1e6)
  }, [data.lane1])

  React.useEffect(() => {
    trigger(2, data.lane2 / 1e6)
  }, [data.lane2])

  React.useEffect(() => {
    trigger(3, data.lane3 / 1e6)
  }, [data.lane3])

  React.useEffect(() => {
    trigger(4, data.lane4 / 1e6)
  }, [data.lane4])


  function trigger(lane, time) {
    if (raceState.status === 'RACING') {
      // TODO: Ignore event if not on the racing page

      // Ignore event if lane is disabled
      if (!lanes.includes(lane)) {
        return console.log("Info: ignoring event trigger (lane disabled)")
      }

      console.log(lane, time)
      // A car crossed the finish line.

      // We are guaranteed not to receive more than one trigger per lane. UPDATE: NO!
      // Oops, serious bug here! The arduino might give us more than one trigger now. So glad we tested for this!!!!!!
      // Fixed via:  if ($cope.raceTImes[data.lane] === 0)

      // This may not be up to date...the only guarantee is to compute the place within the reducer, but then we cannot save it from there

      // TODO: Figure out the best time and place to save the race results

      raceDispatch({ type: 'trigger', lane, time })



    }
  }

  React.useEffect(() => {
    console.log(data.pinStateBin)
  }, [data.pinStateBin])

  function deferTemporarily(lane) {
    // Swap car racing and car on deck    
    raceDispatch({ type: 'deferTemporarily', lane })
  }

  async function deferPermanently(lane) {

    var car = getRacing(lane)
    if (!car) return

    let result = await api.cars.update({ ...car, deferPerm: 1 }).execute()
    // TODO: Figure out how to know when the car has actually been updated, and then move to the next run

    // TODO: This is not allowed, what do we need to do instead?
    // for (var j = 0; j < cars.length; j++) {
    //   cars[j].onDeckLane = 0
    //   cars[j].racingLane = 0
    // }

    raceDispatch({ type: 'moveToNextRun' })
    raceDispatch({ type: 'moveToNextRun' })


  };

  /**
   * Get all the results for the specified car
   * @param {Car} car The car whose results to get
   * @returns {Result[]} The results of the specified car
   */
  function getResultsByCar(results, car) {
    return results.filter(r => r.carId === car.carId)
  }

  function getRacing(cars, lane) {
    return cars.find(car => car.carId === raceState.racingLane[lane])
  }

  function getRacingName(lane, opts) {
    opts = opts || {}
    var thing = getRacing(lane)
    if (thing) {
      return thing.carName
    }
    else {
      if (opts.colorIfUnassigned)
        return laneColors[lane] + " Lane"
      else
        return "Unassigned"
    }
  }

  function getRacingNickname(lane, opts) {
    opts = opts || {}
    var thing = getRacing(lane)
    if (thing) {
      return thing.nickname
    }
  }

  function getOnDeck(cars, lane) {
    return cars.find(car => car.carId === raceState.onDeckLane[lane])
  }

  function getOnDeckName(lane) {
    var thing = getOnDeck(lane)
    if (thing) {
      return thing.carName
    }
    else {
      return "Unassigned"
    }
  };

  function formatTime(time) {
    if (time === 10) {
      return "DNF"
    }
    else {
      return time.toFixed(4)
    }
  }

  function tick() {
    raceDispatch({ type: 'setCurrentTime', time: Date.now() })
  }

  // This effect should fire every time there is a tick
  React.useEffect(() => {

    if (raceState.status === 'RACING') {

      if (raceState.currentTime - raceState.gateReleaseTime > 6000) {
        // Assign DNF results for all lanes which did not finish
        raceDispatch({ type: 'assignDnf' })
      }

      // Ensure that all lanes have a result before achievements are awarded.
      if (raceState.standingsThisRace.length === lanes.length) {
        // All lanes have a result, so we can now award achievements.
        raceDispatch({ type: 'awardAchievements' })
      }

      // Ensure that all achievements have been awarded before stopping the race.
      if (raceState.achievementsThisRace) {
        stopRace()
      }

    }

    if (raceState.status === 'ENDED') {
      if (raceState.arduinoReady && raceState.weAreReady) {
        clearInterval(refHandleTick.current)
        refHandleTick.current = null
        readyForStart()
      }
    }
  }, [raceState.currentTime])

  function stopRace() {

    // TODO: Save results and achievements

    raceDispatch({ type: 'stopRace' })


    // Compute and animate standings
    // Create array, then sort by bestTime:
    /**
     * [
     *   {
     *     name,
     *     bestTime
     *   }
     * ]
     */

    let bestBestTime = 9999
    let allTimes = []
    for (var i = 0; i < _cars.length; i++) {
      let car = _cars[i]
      let results = getResultsByCar(_results, car)
      let bestTime = 9999
      for (let j = 0; j < results.length; j++) {
        if (results[j].time < bestTime) {
          bestTime = results[j].time
        }
      }
      if (bestTime < 9999) {
        allTimes.push({
          carName: car.carName,
          nickname: car.nickname && (' ' + car.nickname),
          time: bestTime
        })
        if (bestTime < bestBestTime) {
          bestBestTime = bestTime
        }
      }
    }

    allTimes.sort(function (a, b) { return a.time - b.time })

    for (let i = 0; i < allTimes.length; i++) {
      allTimes[i].place = i + 1
      allTimes[i].deltaTime = allTimes[i].time - bestBestTime
    }

    const newStandings = []

    for (var i = 0; i < allTimes.length; i++) {
      let j = i
      if (i == 12) break
      // This hack creates the animation
      setTimeout(function () {
        raceDispatch({ type: 'addStanding', standing: allTimes[j] })
      }, 8000 + j * 100)
    }
    setTimeout(function () {
      broadcast('stopRecording')
    }, 400)

    setTimeout(function () {
      broadcast('showInstantReplay')
    }, 600)

    setTimeout(function () {
      raceDispatch({ type: 'setWeAreReady' })
    }, 8000)

  }

  function readyForStart() {
    console.log('readyForStart')

    raceDispatch({ type: 'readyForStart1' })
    raceDispatch({ type: 'moveToNextRun' })
    setTimeout(() => {
      // Delay the second set of updates to match the animation delay
      raceDispatch({ type: 'readyForStart2' })
    }, 1000)

    // Reset the video and mediaRecorder
    broadcast('startVideo')
    broadcast('hideVideo')
  }

  function computeStandings() {

  };

  function saveResult(car, lane, time, place, date) {

    var newResult = {
      lane: lane,
      time: time,
      place: place,
      resultDate: moment(date).format("YYYY-MM-DD HH:mm:ss"),
      carId: car.carId,
      eventId: _event.id
    }



  };

  function getPlace(lane) {
    var place = 1
    if (raceState.raceTimes[lane]) {
      for (let i in lanes) {
        if (lanes[i] != lane && raceState.raceTimes[lanes[i]] && raceState.raceTimes[lanes[i]] < raceState.raceTimes[lane]) {
          place++
        }
      }
      return place
    }
    else {
      return ''
    }
  };

  function getRacingId(lane) {
    var thing = getRacing(lane)
    if (thing) {
      return thing.carId
    }
    else {
      return "none"
    }
  };

  function getOnDeckId(lane) {
    var thing = getOnDeck(lane)
    if (thing) {
      return thing.carId
    }
    else {
      return "none"
    }
  };

  function broadcast() {
    console.warn('broadcast not implemented')
  }


  return (
    <div className='fullpage-wrapper'>
      {/* <ConnectTrackModal connected={connected} connecting={connecting} connect={connect} /> */}
      <div className='fullpage' x-hide-overflow="">

        <div className={`now-racing ${raceState.animateRacing ? 'animateRacing' : ''} ${raceState.status === 'RACING' || raceState.status === 'ENDED' ? 'collapse-now-racing' : ''}`}>
          <h1>NOW RACING</h1>
          <Grid container>


            {allLanes.map(lane => (
              <Grid item xs={3}>


                <div className="now-racing-section" >

                  {data.pinStates && data.pinStates[lane] === 0 && <div className="pinStateWarning">warning</div>}
                  {(getRacing(lane) || lanes.indexOf(lane) >= 0) &&
                    <div >

                      <PopupState variant="popover" >
                        {(popupState) => (
                          <React.Fragment>
                            <div variant="contained" color="primary" {...bindTrigger(popupState)}>
                              <a href className='name' uib-dropdown-toggle id="simple-dropdown{{lane}}">

                                <h2>{getRacingName(lane)}</h2>
                                <h3>{getRacingNickname(lane) || <span>&nbsp;</span>}</h3>
                                {/* <h3 ng-show="(status === 'READY')">{getRacingNickname(lane) || '&nbsp;'}</h3>  */}
                              </a>
                            </div>
                            <Menu {...bindMenu(popupState)}>
                              <MenuItem onClick={() => { popupState.close(); deferTemporarily(lane) }}>Defer for one race</MenuItem>
                              <MenuItem onClick={() => { popupState.close(); deferPermanently(lane) }}>Defer permanently</MenuItem>
                            </Menu>
                          </React.Fragment>
                        )}
                      </PopupState>



                      {/*<div className="time-countdown" ng-show="status === 'READY' && raceTimes[lane] === 0">{{ 0 | number: 4}}</div> */}

                      {(raceState.status === 'RACING' || raceState.status === 'ENDED') && raceState.raceTimes[lane] === 0 &&
                        <div className={`time-countdown ${raceState.status === 'ENDED' ? 'time-countdown-fade' : ''}`}>
                          {formatTime((raceState.currentTime - raceState.gateReleaseTime) / 1000)}
                        </div>
                      }

                      {(raceState.status === 'RACING' || raceState.status === 'ENDED') && raceState.raceTimes[lane] !== 0 && raceState.raceTimes[lane] !== 10 &&
                        <div className={`time-final ${getPlace(lane) == 1 ? 'time-final-winner' : ''}`}>
                          {formatTime(raceState.raceTimes[lane])}
                        </div>
                      }

                      {/* <div className="time-final" ng-show="status === 'ENDED'">{{ raceTimes[lane] | number : 4 | zeroFilter}}</div> */}

                      {(raceState.status === 'RACING' || raceState.status === 'ENDED') && raceState.raceTimes[lane] !== 0 &&
                        <div className='result-place-wrapper' p>
                          <div className={`result-place ${getPlace(lane) != '' ? 'result-place-show' : ''}`}>{getPlace(lane)}</div>
                        </div>}


                      <div className="now-racing-section-image">

                        {getRacing(lane) ?
                          <img className={`${false ? 'readyToRace' : ''}`} src={`/cars/${getRacing(lane).carId}.jpg`} />
                          :
                          <img className={`${false ? 'readyToRace' : ''}`} src={noneCar} />
                        }


                      </div>
                    </div>
                  }
                </div>
              </Grid>
            ))}
          </Grid>
        </div>

        <div className="achievements-wrapper">
          {allLanes.map(lane => (
            <div className="col-xs-3 achievement-section" >
              {raceState.achievementsThisRace[lane]?.map((a) => (
                <div className="achievement" >
                  ★ {{ a }}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div id="instant-replay" instant-replay>
          <video></video>
        </div>

        <div className={`on-deck ${raceState.animateOnDeckMoveUp ? 'animateOnDeckMoveUp' : ''} ${raceState.animateOnDeckAppear ? 'animateOnDeckAppear' : ''}`}>
          <h1>ON DECK</h1>
          <Grid container>
            {allLanes.map(lane => (
              <Grid item xs={3}>
                {(getOnDeck(lane) || lanes.indexOf(lane) >= 0) &&
                  <div className='onDeckSection'>
                    <div className="name"><h2>{getOnDeckName(lane)}</h2></div>
                    {getOnDeck(lane) ?
                      <img src={`/cars/${getOnDeck(lane).carId}.jpg`} />
                      :
                      <img src={noneCar} />
                    }

                  </div>
                }
              </Grid>
            ))}
          </Grid>
        </div>

        {/* <div className="race-message"><span >{messages[messageIndex]}</span></div> */}


        {/* <div className="standings-this-race" ng-show="standingsThisRace.length > 0">
          <h1>RACE RESULTS</h1>
          <div ng-repeat="standing in standingsThisRace" className="x-angular-animate">
            <div className="standing-place">{{ standing.place }}</div><div className="standing-name">{{ standing.name }}</div><div className="standing-time">{{ standing.time | number : 4}} <span ng-show='standing.deltaTime>0'>(+{{ standing.deltaTime | number:4}})</span></div>
          </div>
        </div>  */}
        {raceState.standings.length > 0 && raceState.status === 'ENDED' &&
          <div className="current-standings">
            {/* <h1>CURRENT STANDINGS</h1> --30 */}
            {raceState.standings.map(standing => (
              <>
                <div className="standing-wrapper x-angular-animate">
                  <div className="standing-place">
                    {standing.place}
                  </div>
                  <div className="standing-name">
                    <span>
                      {standing.carName}
                    </span>
                    <span className="standing-nickname">
                      {standing.nickname}
                    </span>
                  </div>
                  <div className="standing-time">
                    {formatTime(standing.time)}
                    {standing.deltaTime > 0 && standing.deltaTime < 4 &&
                      <span ng-show=''>
                        (+{standing.deltaTime.toFixed(4)})
                    </span>
                    }
                  </div>
                </div>
              </>
            ))}
          </div>
        }

        {raceState.status === 'ENDED' &&
          <div className="racing-next" ng-show="status=='ENDED'">
            <h2>
              Up next:
              <span className='lane-color-1'>{getOnDeckName(1)}</span>,
              <span className='lane-color-2'>{getOnDeckName(2)}</span>,
              <span className='lane-color-3'>{getOnDeckName(3)}</span>,
              <span className='lane-color-4'>{getOnDeckName(4)}</span>
              {/* <span ng-repeat="lane in allLanes">
              <span>{{ getOnDeckName(lane) }}</span>
            </span>  */}
            </h2>
          </div>
        }


        <div className="standings">

        </div>
        {/*         
        <div ng-show="!serialConnected || debugMode" style="position: absolute; z-index:400; top:600px; left:0; background: gray; border: solid black 1px;">
          <h2>Simulate</h2>
          <button className="btn btn-primary" ng-click="simulateStartGate()">Release starting gate</button>
          <button className="btn btn-primary" ng-click="simulateResetGate()">Reset starting gate</button>
          <h3>Status: {{ status }}</h3>
        </div>
   */}
        {/* <div ng-show="!serialConnected" style="position: absolute; z-index:202; top:0; left:0; background: red; border: solid black 1px; padding: 2px;">
          {{ serialError }}
        </div>
   */}
      </div>
    </div >


  )

}