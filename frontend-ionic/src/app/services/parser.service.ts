import { Injectable } from '@angular/core';
import {
  addMinutes,
  endOfDay,
  format,
  formatISO,
  isAfter,
  isBefore,
  isToday,
  parseISO,
} from 'date-fns';
import { nextcloudUser } from '../config';
import { Calendar } from '../models/calendar';
import { Project } from '../models/project';
import { Todo } from '../models/todo';
import { MessageService } from './message.service';
import { RegexService } from './regex.service';
import { RruleService } from './rrule.service';

@Injectable({
  providedIn: 'root',
})
export class ParserService {
  defaultCalendar: Calendar = {
    name: 'tasks',
    url: 'tasks',
  };

  constructor(
    private rruleService: RruleService,
    private regexService: RegexService,
    private messageService: MessageService
  ) { }

  parseIcalToTodo(xmlRaw: string, rawTodo: string, project: Project): Todo {
    let regexIcsID: RegExp = /\/([a-zA-Z0-9\-]{2,60})\.ics/g;
    let icsID: RegExpExecArray = regexIcsID.exec(xmlRaw);

    let regexUID: RegExp = /UID:(.{2,50})[;|\n]/g;
    let rawUid: RegExpExecArray = regexUID.exec(rawTodo);
    let regexSummary: RegExp = /SUMMARY:(.{2,5000})[;|\n]/g;
    let rawSummary: RegExpExecArray = regexSummary.exec(rawTodo);
    let regexPriority: RegExp = /PRIORITY:(\d{1,2})[;|\n]/g;
    let rawPriority = regexPriority.exec(rawTodo);
    let regexDescription: RegExp = /DESCRIPTION:(.{2,5000})[;|\n]/g;
    let rawDescription: RegExpExecArray = regexDescription.exec(rawTodo);
    let regexCreated: RegExp = /CREATED:(.{2,50})[;|\n]/g;
    let rawCreated: RegExpExecArray = regexCreated.exec(rawTodo);
    let regexModified: RegExp = /LAST-MODIFIED:(.{2,50})[;|\n]/g;
    let rawModified: RegExpExecArray = regexModified.exec(rawTodo);
    let regexStart: RegExp = /DTSTAMP:(.{2,50})[;|\n]/g;
    let rawStart: RegExpExecArray = regexStart.exec(rawTodo);
    let regexDue: RegExp = /DUE:(.{2,50})[;|\n]/g;
    let rawDue: RegExpExecArray = regexDue.exec(rawTodo);
    let regexCategories: RegExp = /CATEGORIES:(.{2,50})[;|\n]/g;
    let rawCategories: RegExpExecArray = regexCategories.exec(rawTodo);
    let regexStatus: RegExp = /STATUS:(.{2,50})[;|\n]/g;
    let rawStatus: RegExpExecArray = regexStatus.exec(rawTodo);
    let regexRrule: RegExp = /RRULE:(.{2,50})[;|\n]/g;
    let rawRrule: RegExpExecArray = regexRrule.exec(rawTodo);
    let regexRelatedTo: RegExp = /RELATED-TO:(.{2,50})[;|\n]/g;
    let rawRelated: RegExpExecArray = regexRelatedTo.exec(rawTodo);
    let regexPercent: RegExp = /PERCENT-COMPLETE:(.{2,50})[;|\n]/g;
    let rawPercent: RegExpExecArray = regexPercent.exec(rawTodo);
    let regexCalendar: RegExp = /;NOCAL=true/g;
    let rawCalendar: RegExpExecArray = regexCalendar.exec(rawTodo);
    let regexDuration: RegExp = /;DURATION=([^;|\n]{2,50})[;|\n]/g;
    let rawDuration: RegExpExecArray = regexDuration.exec(rawTodo);
    let regexEnd: RegExp = /;ENDCAL=([^;|\n]{2,50})/g;
    let rawEnd: RegExpExecArray = regexEnd.exec(rawTodo);
    let regexTags: RegExp = /;TACKS=([^;|\n]{2,50})/g;
    let rawTags: RegExpExecArray = regexTags.exec(rawTodo);

    let todo: Todo = {
      uid: rawUid === null ? 'nouuid' : rawUid[1].toString(),
      icsID: icsID[1].toString(),
      title: rawSummary === null ? '4' : this.unEscapeForIcal(rawSummary[1]),
      priority: rawPriority === null ? 4 : parseInt(rawPriority[1]),
      description: rawDescription === null ? '' : rawDescription[1],
      created: rawCreated === null ? '' : rawCreated[1],
      modified: rawModified === null ? '' : rawModified[1],
      startDate: rawStart === null ? '' : rawStart[1],
      due: rawDue === null ? '' : rawDue[1],
      dueUNIX: 0,
      createdUNIX: 0,
      categories: rawCategories === null ? '' : rawCategories[1],
      status: rawStatus === null ? 'NEEDS-ACTION' : rawStatus[1],
      rrule: rawRrule === null ? '' : rawRrule[1],
      percent: rawPercent === null ? 0 : parseInt(rawPercent[1]),
      raw: rawTodo,
      related: rawRelated === null ? '' : rawRelated[1],
      project: project,
      endDate: rawEnd === null ? '' : rawEnd[1],
      duration: rawDuration === null ? 30 : parseInt(rawDuration[1]),
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      tags: rawTags === null ? [] : rawTags[1].split(","),
      subs: [],
    };
    if (todo.title.match(/\*\s/)) {
      todo.isChecklist = true;
    }
    todo.description = todo.description
      .replace(/\;?ENDCAL=[0-9T]{15}/g, '')
      .replace(/\;?TACKS=[\,|\w]{2,50}/g, '')
      .replace(/\;?DURATION=[0-9]{1,4}/g, '');
    this.showNextEventOfRrule(todo);
    if (todo.due != '') {
      todo.dueUNIX = Math.floor(parseISO(todo.due).getTime() / 1000);
    }

    todo.createdUNIX = Math.floor(parseISO(todo.created).getTime() / 1000);

    // Sort todos with no time tag after the todos with a timestamp
    if (todo.due.includes('000000')) {
      todo.dueUNIX = Math.floor(endOfDay(parseISO(todo.due)).getTime() / 1000);
    }

    if (
      todo.due != '' &&
      !isToday(parseISO(todo.due)) &&
      isBefore(parseISO(todo.due), Date.now())
    ) {
      todo.isOverdue = true;
    }
    return todo;
  }

  showNextEventOfRrule(todo: Todo) {
    if (todo.rrule != undefined && todo.rrule != '' && todo.rrule.length > 5) {
      let regexNextEvent: RegExp = /\;?NEXTEVENT=([0-9T]{15})/g;
      let rawNextEvent: RegExpExecArray = regexNextEvent.exec(todo.description);
      if (rawNextEvent !== null) {
        todo.due = rawNextEvent[1];
      } else {
        try {
          todo.due = formatISO(
            this.rruleService.calculateNextEvent(todo, 'NoNextEvent'),
            { format: 'basic' }
          ).replace(/\+\d\d:00/, '');
        } catch (error) {
          this.messageService.show('⭕ Cannot parse next event', true);
        }
      }
    }
  }

  checkTodoForLogic(todo: Todo) {
    if (todo.title != '' && todo.title.length < 3) {
      this.messageService.show('🖋 Description is to short', true);
      return false;
    }
    if (todo.title != '' && !todo.title.replace(/\s/g, '').length) {
      this.messageService.show('🖋 Description is empty', true);
      return false;
    }

    if (
      todo.due != '' &&
      todo.createdUNIX == null &&
      isAfter(Date.now(), parseISO(todo.due))
    ) {
      this.messageService.show('🖋 Due in the past', true);
      return false;
    }

    if (
      todo.due != '' &&
      isAfter(parseISO(todo.startDate), parseISO(todo.due))
    ) {
      this.messageService.show('🖋 Due before creation', true);
      return false;
    }
    if (todo.title.length < 3) {
      this.messageService.show('🖋 Text to short', true);
      return false;
    }
    return true;
  }

  parseTodoToIcal(todo: Todo) {
    let newRawTodo: string =
      'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//s20\nBEGIN:VTODO\nUID:' +
      todo.uid +
      '\nCREATED:' +
      todo.created +
      '\nLAST-MODIFIED:' +
      todo.modified +
      '\nDTSTAMP:' +
      todo.startDate +
      '\nSUMMARY:' +
      this.escapeForIcal(todo.title) +
      '\nDTSTART:' +
      todo.startDate;

    if (todo.due != '') {
      newRawTodo += '\nDUE:' + todo.due;
    }

    if (todo.status == 'COMPLETED') {
      newRawTodo +=
        '\nPERCENT-COMPLETE:100\nCOMPLETED:' +
        this.regexService.formatIcsDate(Date.now());
    }

    if (todo.rrule != null && todo.rrule != undefined && todo.rrule != '') {
      newRawTodo += '\nRRULE:' + todo.rrule;
    }

    newRawTodo += '\nSTATUS:' + todo.status + '\nPRIORITY:' + todo.priority;

    if (todo.categories != '') {
      newRawTodo += '\nCATEGORIES:' + todo.categories;
    }
    if (todo.related != '') {
      newRawTodo += '\nRELATED-TO:' + todo.related;
    }

    newRawTodo +=
      '\nDESCRIPTION:' +
      todo.description
        .replace(/\;?ENDCAL=[0-9T]{15}/g, '')
        .replace(/\;?TACKS=[\,|\w]{2,50}/g, '')
        .replace(/\;?DURATION=[0-9]{1,4}/g, '');
    if (todo.endDate != '') {
      newRawTodo += ';ENDCAL=' + todo.endDate;
    }

    // Default duration is 30 min if no end date is calculated
    if (todo.endDate == '' && todo.due != '') {
      newRawTodo +=
        ';ENDCAL=' +
        this.regexService.formatIcsDate(addMinutes(parseISO(todo.due), 30));
    }
    if (todo.tags.length > 0) {
      newRawTodo += ';TACKS=' + todo.tags.join(",");
    }

    if (todo.endDate != '') {
      newRawTodo += ';DURATION=' + todo.duration;
    }

    newRawTodo += '\nEND:VTODO\nEND:VCALENDAR';
    return newRawTodo;
  }

  createProjectPersist(projects: Project[]): string {
    let projectsAsString = JSON.stringify(projects);
    let rawTodo: string =
      `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//s20
BEGIN:VTODO
DTSTAMP:20220205T075620
UID:s20-doNotDeleteThis
DESCRIPTION:` +
      projectsAsString +
      `
STATUS:NEEDS-ACTION
SUMMARY:DONT DELETE - S20 PROJECTS
END:VTODO
END:VCALENDAR`;
    return rawTodo;
  }

  formatDateForInterface(todo: Todo): string {
    if (todo.due == null || todo.due == undefined || todo.due == '') {
      return '';
    } else {
      if (
        todo.rrule != undefined &&
        todo.rrule.toLocaleLowerCase() ==
        'FREQ=DAILY;COUNT=1000'.toLocaleLowerCase()
      ) {
        return (
          ' every day ' +
          format(parseISO(todo.due), 'dd.MM.yy HH:mm').replace(' 00:00', '')
        );
      } else if (todo.rrule != undefined && todo.rrule.length > 5) {
        return (
          ' ' +
          format(parseISO(todo.due), 'dd.MM.yy HH:mm').replace(' 00:00', '') +
          ' - every ' +
          todo.rrule
            .replace('FREQ=WEEKLY;INTERVAL=', '')
            .replace(';BYDAY=', ' ')
            .toLowerCase()
        );
      } else {
        return format(parseISO(todo.due), 'dd.MM.yy HH:mm').replace(
          ' 00:00',
          ''
        );
      }
    }
  }

  parseProjects(displayname: string, href: string): Project {
    if (displayname != undefined) {
      return {
        title: displayname,
        url: href
          .replace('/remote.php/dav/calendars/' + nextcloudUser, '')
          .replace('/', ''),
        colour: '',
        position: 0,
        calendar: this.defaultCalendar,
        sorting: 100,
        visible: true,
        count: 0,
      };
    }
  }

  escapeForIcal(string: string): string {
    return string
      .replace(';', '\\;')
      .replace(':', '\\:')

  }

  unEscapeForIcal(string: string): string {
    return string

      .replace('\\;', ';')
      .replace('\\:', ':')

  }

  compareTodos(todo: Todo, recreatedTodo: Todo): boolean {
    let isTheSame: boolean = false;
    for (let key in Object.entries(todo)) {
      for (let keyRec in Object.entries(recreatedTodo)) {
        if (key == keyRec) {
          if (todo[key] == recreatedTodo[keyRec]) {
            isTheSame = true;
          } else {
            return false;
          }
        }
      }
    }
    return isTheSame;
  }
}
