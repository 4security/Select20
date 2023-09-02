import { Injectable } from '@angular/core';
import {
  addDays,
  isAfter,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
  parseISO,
  startOfDay,
} from 'date-fns';
import { Todo } from '../models/todo';
import { RegexService } from './regex.service';

@Injectable({
  providedIn: 'root',
})
export class RruleService {
  constructor(private regexService: RegexService) { }

  calculateNextEvent(todo: Todo, savedNextEvent: string) {

    // Examples:
    // RRULE:FREQ=DAILY;INTERVAL=2
    // FREQ=WEEKLY;INTERVAL=1;BYDAY=WE

    let regexIntevall: RegExp = /INTERVAL=(\d+)/g;
    let intervall: RegExpExecArray = regexIntevall.exec(todo.rrule);
    let intervallExtracted: number =
      intervall === null ? 1 : parseInt(intervall[1]);
    let nextEvent: Date;

    // Remove one day because nextXXXX() functions add further 7 days

    if (savedNextEvent == 'nonextevent') {
      nextEvent = addDays(parseISO(todo.due), (intervallExtracted - 1) * 7);
    } else {
      nextEvent = addDays(
        parseISO(savedNextEvent),
        (intervallExtracted - 1) * 7
      );
    }

    // every day --> toggle to next day
    if (todo.rrule == 'FREQ=DAILY;COUNT=1000') {
      if (todo.due == '') {
        nextEvent = addDays(startOfDay(Date.now()), 1);
      } else {
        // keep time while shifting the next date to the next day
        let time: string = todo.due.slice(-6);
        let today: string =
          this.regexService.formatIcsDate(Date.now()).substring(0, 9) + time;

        nextEvent = addDays(parseISO(today), 1);
      }
      return nextEvent;
    }

    let regexByDate: RegExp = /BYDAY=([A-Z][A-Z])/g;
    let bydate: RegExpExecArray = regexByDate.exec(todo.rrule);
    let byDateExtracted: string = bydate === null ? 'MO' : bydate[1];

    switch (byDateExtracted) {
      case 'MO':
        nextEvent = nextMonday(nextEvent);
        break;
      case 'TU':
        nextEvent = nextTuesday(nextEvent);
        break;
      case 'WE':
        nextEvent = nextWednesday(nextEvent);
        break;
      case 'TH':
        nextEvent = nextThursday(nextEvent);
        break;
      case 'FR':
        nextEvent = nextFriday(nextEvent);
        break;
      case 'SA':
        nextEvent = nextSaturday(nextEvent);
        break;
      case 'SU':
        nextEvent = nextSunday(nextEvent);
        break;
      default:
        nextEvent = nextSunday(nextEvent);
        break;
    }

    return nextEvent;
  }
}
