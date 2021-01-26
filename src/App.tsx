import React, { useState } from 'react'
import './App.css'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/react'
import { config, options, EventId } from './machine'

const TIME_SLOTS = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-22:00',
]

function ActionButton({
  action,
  onClick,
  availableActions,
}: {
  action: EventId
  onClick: (event: React.MouseEvent) => void
  availableActions: EventId[]
}) {
  return (
    <button
      disabled={!availableActions.includes(action)}
      onClick={onClick}
      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 focus:outline-none disabled:opacity-50"
    >
      {action}
    </button>
  )
}

function App() {
  const [current, send] = useMachine(() => createMachine(config, options))
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0])
  return (
    <>
      <div className="text-center space-x-2 mt-4">
        <ActionButton
          action={'START'}
          onClick={() => send('START')}
          availableActions={current.nextEvents as EventId[]}
        />
        <ActionButton
          action={'TIMESLOT_SELECTED'}
          onClick={() => send('TIMESLOT_SELECTED', { data: { timeSlot } })}
          availableActions={current.nextEvents as EventId[]}
        />
        <select
          disabled={!current.nextEvents.includes('TIMESLOT_SELECTED') && !current.nextEvents.includes('FORCE')}
          onChange={(event) => setTimeSlot(event.target.value)}
          value={timeSlot}
          className="text-pink-500 font-semibold"
        >
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
        <ActionButton
          action={'FORCE'}
          onClick={() => send('FORCE', { data: { timeSlot } })}
          availableActions={current.nextEvents as EventId[]}
        />
        <ActionButton
          action={'CANCEL'}
          onClick={() => send('CANCEL')}
          availableActions={current.nextEvents as EventId[]}
        />
        <ActionButton
          action={'RESET'}
          onClick={() => send('RESET')}
          availableActions={current.done ? [] : (current.nextEvents as EventId[])}
        />
      </div>
      <code className="m-4 block">
        <hr className="mt-4 mb-4" />
        <h4>Current State:</h4>
        {JSON.stringify(current.value, null, 2)}

        <hr className="mt-4 mb-4" />
        <h4>Events:</h4>
        {current.context.history.map(({ type, data }, index) => (
          <div key={index}>
            <pre>Type: {type}</pre>
            <pre>Data: {JSON.stringify(data)}</pre>
          </div>
        ))}
      </code>
    </>
  )
}

export default App
