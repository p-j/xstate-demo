import { assign, EventObject, MachineConfig, MachineOptions } from 'xstate'

function sleep(ms: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

export type EventId = 'START' | 'SMS_SENT' | 'SMS_FAILED' | 'TIMESLOT_SELECTED' | 'FORCE' | 'CANCEL' | 'RESET'

export interface TimeSlotMachineEvent extends EventObject {
  type: EventId
  data: any
}

export interface TimeSlotMachineStateSchema {
  states: {
    idle: {}
    sendingSMS: {}
    waitingForReply: {}
    selectingTimeSlot: {}
    timeSlotSelected: {}
  }
}

export type AvailableTimeSlotMachineStates = keyof TimeSlotMachineStateSchema['states']

export interface TimeSlotMachineContext {
  timeSlot: string | null
  attempt: number
  maxAttempt: number
  history: TimeSlotMachineEvent[]
}

export const config: MachineConfig<TimeSlotMachineContext, TimeSlotMachineStateSchema, TimeSlotMachineEvent> = {
  id: 'timeslot machine',
  initial: 'idle',
  context: {
    timeSlot: null,
    attempt: 0,
    maxAttempt: 3,
    history: [],
  },
  states: {
    idle: {
      on: {
        START: { target: 'sendingSMS', actions: 'history' },
        FORCE: { target: 'timeSlotSelected', actions: 'history' },
      },
    },
    sendingSMS: {
      invoke: {
        id: 'sendSMS',
        src: async (context, event) => {
          await sleep(1000)
          if (Math.random() * 100 < 70) return Promise.reject('Failed SMS')
          return Promise.resolve(true) // Success
        },
        onDone: { target: 'waitingForReply', actions: ['incrementAttempt', 'history'] },
        onError: [
          {
            target: 'sendingSMS',
            cond: (context) => context.attempt <= context.maxAttempt,
            actions: ['incrementAttempt', 'history'],
          },
          { target: 'selectingTimeSlot', actions: 'history' },
        ],
      },
      on: { CANCEL: { target: 'idle', actions: 'history' } },
    },
    waitingForReply: {
      on: { TIMESLOT_SELECTED: { target: 'timeSlotSelected', actions: ['assignTimeSlot', 'history'] } },
    },
    selectingTimeSlot: {
      on: { TIMESLOT_SELECTED: { target: 'timeSlotSelected', actions: ['assignTimeSlot', 'history'] } },
    },
    timeSlotSelected: { type: 'final' },
  },
  on: {
    RESET: {
      actions: ['reset'],
      target: 'idle',
    },
  },
}

export const options: Partial<MachineOptions<TimeSlotMachineContext, TimeSlotMachineEvent>> = {
  actions: {
    assignTimeSlot: assign<TimeSlotMachineContext, TimeSlotMachineEvent>({
      timeSlot: (context, event) => {
        console.log(event)
        return event.data.timeSlot
      },
    }),
    incrementAttempt: assign<TimeSlotMachineContext, TimeSlotMachineEvent>({
      attempt: (context, event) => context.attempt + 1,
    }),
    history: assign<TimeSlotMachineContext, TimeSlotMachineEvent>({
      history: (context, event) => [...context.history, event],
    }),
    reset: assign<TimeSlotMachineContext, TimeSlotMachineEvent>({
      timeSlot: null,
      attempt: 0,
      maxAttempt: 3,
      history: [],
    }),
  },
}
