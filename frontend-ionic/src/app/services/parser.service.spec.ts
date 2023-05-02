import { TestBed } from '@angular/core/testing';
import { Todo } from '../models/todo';
import { MessageService } from './message.service';
import { Storage } from '@ionic/storage';
import { RegexService } from './regex.service';
import { addDays, isFriday, isSaturday, parseISO } from 'date-fns';
import { ParserService } from './parser.service';
import { RruleService } from './rrule.service';
import { Project } from '../models/project';
import { defaultCurrentProject } from '../config';

describe('ParserService', () => {
  let service: ParserService;
  let regexService: RegexService;
  let todo: Todo;
  let recreatedTodo: Todo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService, RegexService, RruleService, Storage],
    });

    service = TestBed.inject(ParserService);
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
      project: defaultCurrentProject,
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
      project: defaultCurrentProject,
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
  });

  it('check if reversible with correct encoding', () => {
    let todoString = service.parseTodoToIcal(todo);
    let project: Project = {
      title: 'myp,y,a:;;..,,,,,w-asfd.:::UID:roject',
      url: 'myproject',
      colour: '',
      intendation: 0,
      calendar: null,
      sorting: 1,
      visible: true,
      count: 0,
    };

    let recreatedTodo: Todo = service.parseIcalToTodo(
      '<<</ynlk93qe9pr9prk6rmi1ejblncb2huls7.ics<<<',
      todoString,
      project
    );

    recreatedTodo.raw = '';
    recreatedTodo.dueUNIX = 0;
    recreatedTodo.createdUNIX = 0;

    expect(service.compareTodos(todo, recreatedTodo)).toBeTrue();
  });
});
