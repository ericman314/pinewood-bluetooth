import PopupState from 'material-ui-popup-state'
import React from 'react'
import { useBluetooth } from '../hooks/useBluetooth'
import { useAppState } from '../useAppState'
import { ConnectTrackModal } from './ConnectTrackModal'
import './css/HomeView.css'

export function Race(props) {

  const { state, dispatch } = useAppState()


  const { data, connected, connecting, connect } = useBluetooth()

  /** All of the lanes */
  const allLanes = [1, 2, 3, 4];

  /** All lanes which are operational */
  const lanes = [1, 2, 3, 4];


  return (
    <div className='fullpage-wrapper'>
      <ConnectTrackModal connected={connected} connecting={connecting} connect={connect} />
      <div className='fullpage' x-hide-overflow="">

        <div className={`now-racing ${animateRacing ? 'animateRacing' : ''} ${status === 'RACING' || status === 'ENDED' ? 'collapse-now-racing' : ''}`}>
          <h1>NOW RACING</h1>
          {allLanes.map(lane => (
            <div className="col-xs-3 now-racing-section" >

              {data.pinStates[lane] === 0 && <div className="pinStateWarning">!</div>}
              {getRacing(lane) || lanes.indexOf(lane) >= 0 &&
                <div >

                  <PopupState variant="popover" >
                    {(popupState) => (
                      <React.Fragment>
                        <Button variant="contained" color="primary" {...bindTrigger(popupState)}>
                          <a href className='name' uib-dropdown-toggle id="simple-dropdown{{lane}}">

                            <h2>{getRacingName(lane)}</h2>
                            <h3>{getRacingNickname(lane) || '&nbsp;'}</h3>
                            {/* <h3 ng-show="(status === 'READY')">{getRacingNickname(lane) || '&nbsp;'}</h3>  */}
                          </a>
                        </Button>
                        <Menu {...bindMenu(popupState)}>
                          <MenuItem onClick={() => { popupState.close; deferTemporarily(lane) }}>Defer for one race</MenuItem>
                          <MenuItem onClick={() => { popupState.close; deferPermanently(lane) }}>Defer permanently</MenuItem>
                        </Menu>
                      </React.Fragment>
                    )}
                  </PopupState>



                  {/*<div className="time-countdown" ng-show="status === 'READY' && raceTimes[lane] === 0">{{ 0 | number: 4}}</div> */}

                  {(status === 'RACING' || status === 'ENDED') && raceTimes[lane] === 0 &&
                    <div className={`time-countdown ${status === 'ENDED' ? 'time-countdown-fade' : ''}`}>
                      {formatTime((currentTime - gateReleaseTime) / 1000)}
                    </div>
                  }

                  {(status === 'RACING' || status === 'ENDED') && raceTimes[lane] !== 0 && raceTimes[lane] !== 10 &&
                    <div className={`time-final ${getPlace(lane) == 1 ? 'time-final-winner' : ''}`}>
                      {formatTime(raceTimes[lane])}
                    </div>
                  }

                  {/* <div className="time-final" ng-show="status === 'ENDED'">{{ raceTimes[lane] | number : 4 | zeroFilter}}</div> */}

                  {(status === 'RACING' || status === 'ENDED') && raceTimes[lane] !== 0 &&
                    <div className='result-place-wrapper' p>
                      <div className="{'result-place':true, 'result-place-show':getPlace(lane)!=''}">{getPlace(lane)}</div>
                    </div>}


                  <div className="now-racing-section-image"><img className="{nowRacingImg:readyToRace}" ng-src="cars/{{getRacingId(lane)}}.jpg" /></div>
                </div>
              }
            </div>
          ))}
        </div>

        <div className="achievements-wrapper">
          {allLanes.map(lane => (
            <div className="col-xs-3 achievement-section" >
              {achievementsThisRace[lane].map((a) => (
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

        <div className={`col-xs-12 on-deck ${animateOnDeckMoveUp ? 'animateOnDeckMoveUp' : ''}, ${animateOnDeckAppear ? 'animateOnDeckAppear' : ''}`}>
          <h1>ON DECK</h1>
          {allLanes.map(lane => (
            <div className="col-xs-3" >
              {(getOnDeck(lane) || lanes.indexOf(lane) >= 0) &&
                <div>
                  <div className="name"><h2>{getOnDeckName(lane)}</h2></div>
                  <div><img ng-src="cars/{{getOnDeckId(lane)}}.jpg" /></div>

                </div>
              }
            </div>
          ))}
        </div>

        <div className="race-message"><span >{messages[messageIndex]}</span></div>


        {/* <div className="standings-this-race" ng-show="standingsThisRace.length > 0">
          <h1>RACE RESULTS</h1>
          <div ng-repeat="standing in standingsThisRace" className="x-angular-animate">
            <div className="standing-place">{{ standing.place }}</div><div className="standing-name">{{ standing.name }}</div><div className="standing-time">{{ standing.time | number : 4}} <span ng-show='standing.deltaTime>0'>(+{{ standing.deltaTime | number:4}})</span></div>
          </div>
        </div>  */}
        {standings.length > 0 && status === 'ENDED' &&
          <div className="current-standings">
            {/* <h1>CURRENT STANDINGS</h1> --30 */}
            {standings.map(standing => (
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

        {status === 'ENDED' &&
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