import { TestBed } from '@angular/core/testing';
import { Todo } from '../models/todo';
import { MessageService } from './message.service';
import { Storage } from '@ionic/storage';
import { RegexService } from './regex.service';
import { isSameDay, parseISO } from 'date-fns';
import { RruleService } from './rrule.service';

describe('RruleService', () => {
  let service: RruleService;
  let regexService: RegexService;
  let todo: Todo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService, RegexService, RruleService, Storage],
    });

    service = TestBed.inject(RruleService);
    regexService = TestBed.inject(RegexService);
    todo = {
      icsid: 'ynlk93qe9pr9prk6rmi1ejblncb2huls7',
      uid: 'ynlk93qe9pr9prk6rmi1ejblncb2huls7',
      title: 'default',
      priority: 4,
      description: '',
      created: regexService.formatIcsDate(Date.now()),
      modified: regexService.formatIcsDate(Date.now()),
      startdate: '',
      due: '',
      dueUNIX: 0,
      createdUNIX: 0,
      categories: '',
      status: 'NEEDS-ACTION',
      precent: 0,
      raw: '',
      enddate: '',
      rrule: '',
      duration: 30,
      related: '',
      project: 'myproject',
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
  });

  afterEach(() => {
    todo = {
      icsid: 'ynlk93qe9pr9prk6rmi1ejblncb2huls7',
      uid: 'ynlk93qe9pr9prk6rmi1ejblncb2huls7',
      title: 'default',
      priority: 4,
      description: '',
      created: regexService.formatIcsDate(Date.now()),
      modified: regexService.formatIcsDate(Date.now()),
      startdate: '',
      due: '',
      dueUNIX: 0,
      createdUNIX: 0,
      categories: '',
      status: 'NEEDS-ACTION',
      precent: 0,
      raw: '',
      enddate: '',
      rrule: '',
      duration: 30,
      related: '',
      project: 'myproject',
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
  });

  it('every mon', () => {
    todo.rrule = 'INTERVAL=1;BYDAY=SU';
    let date = service.calculateNextEvent(todo, '20220815T190000');
    console.log(date, parseISO('20220821T190000'));
    expect(isSameDay(date, parseISO('20220821T190000'))).toBeTrue();
  });

  it('every 2 tue calc', () => {
    todo.rrule = 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU';
    let date = service.calculateNextEvent(todo, '20220815T190000');
    expect(isSameDay(date, parseISO('20220823T190000'))).toBeTrue();
  });

  it('every 3 wed', () => {
    todo.rrule = 'FREQ=WEEKLY;INTERVAL=3;BYDAY=WE';
    let date = service.calculateNextEvent(todo, '20220815T190000');
    expect(isSameDay(date, parseISO('20220831T190000'))).toBeTrue();
  });

  it('every 3 wed with prev event', () => {
    todo.rrule = 'FREQ=WEEKLY;INTERVAL=3;BYDAY=WE';
    todo.due = '20220815T190000';
    let date = service.calculateNextEvent(todo, 'nonextevent');
    expect(isSameDay(date, parseISO('20220831T190000'))).toBeTrue();
  });
});
