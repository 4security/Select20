import { Injectable, OnInit } from '@angular/core';
import {
  addDays,
  addMinutes,
  formatISO,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
  parse,
  parseISO,
} from 'date-fns';
import { Todo } from '../models/todo';
import { MessageService } from './message.service';
import { Project } from '../models/project';


@Injectable({
  providedIn: 'root',
})
export class RegexService {
  projectTitles: string[] = [];
  projects: Project[] = []

  constructor(
    private messageService: MessageService
  ) {
  }

  extractKeywords(summary: string, todo: Todo, projects, projectTitles): Todo {
    this.projectTitles = projectTitles;
    this.projects = projects;

    summary = this.detectPrio(summary, todo);
    summary = this.detectRrule(summary, todo);
    summary = this.detectDay(summary, todo);
    summary = this.detectTime(summary, todo);
    summary = this.detectDuration(summary, todo);
    summary = this.detectProject(summary, todo);
    summary = this.detectChecklist(summary, todo);

    // Detect up to 3 tags
    for (let ctrTags = 0; ctrTags < 3; ctrTags++) {
      summary = this.detectTags(summary, todo);
    }

    todo.title = summary.replace(/<div>|<\/div>|<br>|<\/br>|&nbsp;/g, '');
    todo.isOverdue = false;
    return todo;
  }

  detectRrule(summary: string, todo: Todo): string {
    let rrule: string = 'FREQ=WEEKLY;INTERVAL=';
    if (summary.match(/[e|E]very\s?day/i)?.input) {
      todo.rrule = 'FREQ=DAILY;COUNT=1000';
      summary = summary.replace(/\s?[e|E]very\s?day/i, '');
      return summary;
    }

    if (
      summary.match(/[e|E]very\s\d?\s?(mon|tue|wed|thu|fri|sat|sun)/i)?.input
    ) {
      let regexEveryX: RegExp = /every\s(\d*)/g;
      let raweveryX: RegExpExecArray = regexEveryX.exec(summary);
      let everyX: string = raweveryX === null ? '1' : raweveryX[1];
      if (everyX.length > 0) {
        rrule += everyX;
      } else {
        rrule += '1';
      }
      let regexEveryWeekday: RegExp =
        /every\s\d{0,2}\s?(mon|tue|wed|thu|fri|sat|sun)/g;
      let everyWeekday: RegExpExecArray = regexEveryWeekday.exec(summary);

      rrule +=
        ';BYDAY=' +
        (everyWeekday === null
          ? 'MO'
          : everyWeekday[1].toUpperCase().substring(0, 2));

      summary = summary.replace(
        /\s?[e|E]very\s?\d{0,2}\s?(mon|tue|wed|thu|fri|sat|sun)/i,
        ''
      );
      todo.rrule = rrule;
      return summary;
    }

    return summary;
  }

  detectPrio(summary: string, todo: Todo): string {
    if (summary.match(/(\s[p|P]([1-4])|[p|P]([1-4]\s))/i)?.input) {
      let regexPrio: RegExp = /[p|P]([1-4])/g;
      let rawPriority: RegExpExecArray = regexPrio.exec(summary);
      todo.priority =
        rawPriority === null ? todo.priority : parseInt(rawPriority[1]);
      if (rawPriority != null) {
        summary = summary.replace(/[p|P]([1-4])/i, '');
      }
    }

    return summary;
  }

  detectProject(summary: string, todo: Todo): string {
    if (summary.match(/\s[0-9A-Za-z]*#[A-Za-z]+|^#[A-Za-z]+/i)?.input) {
      let regexProject: RegExp = /#([A-Za-z]+)/g;
      let rawProject: RegExpExecArray = regexProject.exec(summary);
      let project = rawProject === null ? todo.project : rawProject[1];
      let resultSearch: string = this.fuzzySearchInArray(project, this.projectTitles)[0];

      if (resultSearch == null || resultSearch == undefined) {
        todo.project.title = 'Inbox';
      } else {
        todo.project = this.projects.find(project => project.title === resultSearch);;
      }
      summary = summary.replace(/\s?#[A-Za-z]+/i, '');
    }

    return summary;
  }

  detectTime(summary: string, todo: Todo): string {
    if (summary.match(/(\s\d?\d\:\d\d|\d?\d\:\d\d\s)/i)?.input) {
      let regexTime: RegExp = /(\d?\d\:\d\d)/g;
      let time: RegExpExecArray = regexTime.exec(summary);
      let extactedTime: string = time === null ? '' : time[1];
      summary = summary.replace(extactedTime, '');

      if (extactedTime.length == 4) {
        extactedTime = '0' + extactedTime;
      }

      if (todo.due == '') {
        todo.due = this.formatIcsDate(Date.now());
      }

      todo.due = todo.due.replace(
        /\d{6}$/i,
        extactedTime.replace(':', '') + '00'
      );
    }

    return summary;
  }

  detectDay(summary: string, todo: Todo): string {
    if (
      summary.match(/(\s\d\d\.\d\d\.\d\d\d\d|\d\d\.\d\d\.\d\d\d\d\s)/i)?.input
    ) {
      let rawFullDate: RegExpExecArray = /(\d\d\.\d\d\.\d\d\d\d)/.exec(summary);
      let dateString: string = rawFullDate === null ? '' : rawFullDate[1];
      if (dateString != '') {
        try {
          todo.due = this.formatIcsDate(
            parse(dateString, 'dd.MM.yyyy', new Date())
          );
          todo.due = todo.due.replace(/\d{6}\b/i, '000000');
          summary = summary.replace(/(\s?\d\d\.\d\d\.\d\d\d\d)/i, '');
        } catch (error) {
          this.messageService.show(
            '🕐 Dates have a simple dot and timestamps have double dot',
            true
          );
        }
      }
    }

    if (summary.match(/(\s\d\d\.\d\d\.\d\d|\d\d\.\d\d\.\d\d\s)/i)?.input) {
      let rawFullDate: RegExpExecArray = /(\d\d\.\d\d\.\d\d)/.exec(summary);
      let dateString: string = rawFullDate === null ? '' : rawFullDate[1];
      if (dateString != '') {
        try {
          todo.due = this.formatIcsDate(
            parse(dateString, 'dd.MM.yy', new Date())
          );
          todo.due = todo.due.replace(/\d{6}\b/i, '000000');
          summary = summary.replace(/(\s?\d\d\.\d\d\.\d\d)/i, '');
        } catch (error) {
          this.messageService.show(
            '🕐 Dates have a simple dot and timestamps have double dot',
            true
          );
        }
      }
    }

    if (summary.match(/(\s\d\d\.\d\d|\d\d\.\d\d\s)/i)?.input) {
      let rawHalfDate: RegExpExecArray = /(\d\d\.\d\d)/.exec(summary);
      let dateString: string = rawHalfDate === null ? '' : rawHalfDate[1];
      if (dateString != '') {
        try {
          todo.due = this.formatIcsDate(
            parse(
              dateString + '.' + new Date().getFullYear(),
              'dd.MM.yyyy',
              new Date()
            )
          );
          todo.due = todo.due.replace(/\d{6}\b/i, '000000');
          summary = summary.replace(/(\s?\d\d\.\d\d)/i, '');
        } catch (error) {
          this.messageService.show(
            '🕐 Dates have a simple dot and timestamps  have double dot',
            true
          );
        }
      }
    }

    if (summary.match(/\s[t|T]om(orrow)?\b|[t|T]om(orrow)?\s/i)?.input) {
      todo.due = this.formatIcsDate(addDays(Date.now(), 1));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[t|T]om/i, '');
    }

    if (summary.match(/\s[t|T]od(ay)?\b|[t|T]od(ay)?\s/i)?.input) {
      todo.due = this.formatIcsDate(Date.now());
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[t|T]od/i, '');
    }

    if (summary.match(/\s[m|M]on(day)?\b|[m|M]on(day)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextMonday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[m|M]on/i, '');
    }

    if (summary.match(/\s[t|T]ue(sday)?\b|[t|T]ue(sday)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextTuesday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[t|T]ue/i, '');
    }

    if (summary.match(/\s[w|W]ed(nesday)?\b|[w|W]ed(nesday)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextWednesday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[w|W]ed/i, '');
    }

    if (summary.match(/\s[t|T]hu(rsday)?\b|[t|T]hu(rsday)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextThursday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[t|T]hu/i, '');
    }

    if (summary.match(/\s[F|f]ri(day)?\b|[F|f]ri(day)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextFriday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[F|f]ri/i, '');
    }

    if (summary.match(/\s[s|S]at(urday)?\b|[s|S]at(urday)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextSaturday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[s|S]at/i, '');
    }

    if (summary.match(/\s[s|S]un(day)?\b|[s|S]un(day)?\s/i)?.input) {
      todo.due = this.formatIcsDate(nextSunday(Date.now()));
      todo.due = todo.due.replace(/\d{6}\b/i, '000000');
      summary = summary.replace(/\s?[s|S]un/i, '');
    }

    return summary;
  }

  fuzzySearchInArray(item, array: any[] = this.projectTitles): any[] {
    function oc(array: any[]) {
      let object = {};
      for (let i = 0; i < array.length; i++) object[array[i]] = '';
      return object;
    }
    let test = [];
    for (let n = 1; n <= item.length; n++)
      test.push(item.substr(0, n) + '*' + item.substr(n + 1, item.length - n));
    let result = [];
    for (let r = 0; r < test.length; r++)
      for (let i = 0; i < array.length; i++) {
        if (
          array[i].toLowerCase().indexOf(test[r].toLowerCase().split('*')[0]) !=
          -1
        )
          if (
            array[i]
              .toLowerCase()
              .indexOf(test[r].toLowerCase().split('*')[1]) != -1
          )
            if (
              0 <
              array[i]
                .toLowerCase()
                .indexOf(test[r].toLowerCase().split('*')[1]) -
              array[i]
                .toLowerCase()
                .indexOf(test[r].toLowerCase().split('*')[0] < 2)
            )
              if (!(array[i] in oc(result))) result.push(array[i]);
      }

    return result;
  }

  detectDuration(summary: string, todo: Todo): string {
    if (summary.match(/\s([0-9]{1,3})m|([0-9]{1,3})m\s/i)?.input) {
      let regexDuration: RegExp = /([0-9]{1,3})m/g;
      let rawDuration: RegExpExecArray = regexDuration.exec(summary);
      todo.duration = rawDuration === null ? 30 : parseInt(rawDuration[1]);

      if (todo.due != '') {
        todo.enddate = this.formatIcsDate(
          addMinutes(parseISO(todo.due), todo.duration)
        );
      }

      if (rawDuration != null) {
        summary = summary.replace(rawDuration[1] + 'm', '');
      }
      if (todo.duration < 5 || todo.duration > 720) {
        this.messageService.show('Duration to long or short');
        todo.duration = 30;
      }
    }
    return summary;
  }

  detectChecklist(summary: string, todo: Todo): string {
    if (summary.match(/^\*\s/i)?.input) {
      console.log("delect star");
      todo.isChecklist = true;
    } else {
      todo.isChecklist = false;
    }

    return summary;
  }

  detectTags(summary: string, todo: Todo): string {
    if (summary.match(/\@\w{2,15}\b/i)?.input) {
      let regexTags: RegExp = /\@(\w{2,15})\b/g;
      let rawTags: RegExpExecArray = regexTags.exec(summary);
      if (rawTags != null) {
        todo.tags.push(rawTags[1])
        summary = summary.replace("@" + rawTags[1], '');
      }
    }

    return summary;
  }

  formatIcsDate(date): string {
    return formatISO(date, { format: 'basic' }).replace(/\+\d\d:00/i, '');
  }

  stripHtml(html: string): string {
    let tmp: HTMLElement = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
