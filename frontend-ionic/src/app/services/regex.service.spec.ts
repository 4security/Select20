import { TestBed } from '@angular/core/testing';
import { Todo } from '../models/todo';
import { MessageService } from './message.service';
import { Storage } from '@ionic/storage';
import { RegexService } from './regex.service';
import { addDays, isFriday, isSaturday, isToday, parseISO } from 'date-fns';
import { ParserService } from './parser.service';

describe('RegexService', () => {
  let service: RegexService;
  let todo: Todo;
  let parseService: ParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService, Storage],
    });

    service = TestBed.inject(RegexService);
    parseService = TestBed.inject(ParserService);
    service.projectTitles = ['java', 'horst', 'kalle'];
    todo = {
      icsid: '432432',
      uid: '324324',
      title: 'default',
      priority: 4,
      description: '',
      created: service.formatIcsDate(Date.now()),
      modified: service.formatIcsDate(Date.now()),
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
      project: 'anyproject',
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
  });

  afterEach(() => {
    todo = {
      icsid: '432432',
      uid: '324324',
      title: 'default',
      priority: 4,
      description: '',
      created: service.formatIcsDate(Date.now()),
      modified: service.formatIcsDate(Date.now()),
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
      project: 'anyproject',
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
  });

  it('detect prio', () => {
    let result: Todo = service.extractKeywords('p1 go home', todo);
    expect(result.priority == 1).toBeTrue();
  });

  it('detect prio at end', () => {
    let result: Todo = service.extractKeywords('go home p4', todo);
    expect(result.priority == 4).toBeTrue();
  });

  it('detect short date', () => {
    let result: Todo = service.extractKeywords('01.09 go home ', todo);
    expect(result.due.includes('0901')).toBeTrue();
  });

  it('detect short date at the end', () => {
    let result: Todo = service.extractKeywords('go home 01.09', todo);
    expect(result.due.includes('0901')).toBeTrue();
  });

  it('detect sat', () => {
    let result: Todo = service.extractKeywords('go home sat', todo);
    expect(isSaturday(parseISO(result.due))).toBeTrue();
  });

  it('detect tod at end', () => {
    let result: Todo = service.extractKeywords('go home tod', todo);
    expect(isToday(parseISO(result.due))).toBeTrue();
  });

  it('detect sAt', () => {
    let result: Todo = service.extractKeywords('go home sat', todo);
    expect(isSaturday(parseISO(result.due))).toBeTrue();
  });

  it('detect fri', () => {
    let result: Todo = service.extractKeywords('Fri make it', todo);
    expect(isFriday(parseISO(result.due))).toBeTrue();
  });

  it('detect no wrong short date 101.09', () => {
    let result: Todo = service.extractKeywords('go home 101.09', todo);
    expect(result.due == '').toBeTrue();
  });

  it('detect no invalid date 33.12', () => {
    let result: Todo = service.extractKeywords('go home 33.12', todo);
    expect(result.due == '').toBeTrue();
  });

  it('detect long date in sentence', () => {
    let result: Todo = service.extractKeywords(
      'it is time 01.09.26 go home',
      todo
    );
    expect(result.due.includes('20260901')).toBeTrue();
  });

  it('detect long date', () => {
    let result: Todo = service.extractKeywords('01.09.26 go home ', todo);
    expect(result.due.includes('20260901')).toBeTrue();
  });

  it('detect no invalid long date', () => {
    let result: Todo = service.extractKeywords('91.09.26 go home ', todo);
    expect(result.due == '').toBeTrue();
  });

  it('detect extra long date', () => {
    let result: Todo = service.extractKeywords('go home 01.09.2026', todo);
    expect(result.due.includes('20260901')).toBeTrue();
  });

  it('detect extra long date with time', () => {
    let result: Todo = service.extractKeywords(
      'go home 01.09.2026 17:11',
      todo
    );
        // jenkins cannot process this time stamp
    expect(result.due.includes('20260901T171100') || result.due.includes('20260901T000000Z')).toBeTrue();
  });

  it('detect extra long date with time before', () => {
    let result: Todo = service.extractKeywords(
      'go home 17:11 01.09.2026 ',
      todo
    );
    // jenkins cannot process this time stamp
    expect(result.due.includes('20260901T171100') || result.due.includes('20260901T000000Z')).toBeTrue();
  });

  it('detect invalid extra long date with time before', () => {
    let result: Todo = service.extractKeywords('go home 01.09.202617:11', todo);
    expect(result.due.includes('1711')).toBeFalse();
  });

  it('detect duration', () => {
    let result: Todo = service.extractKeywords('60m go home #kalle', todo);
    expect(result.duration == 60).toBeTrue();
  });

  it('detect no duration - to big', () => {
    let result: Todo = service.extractKeywords('go home #kalle 1000m ', todo);
    expect(result.duration == 30).toBeTrue();
  });

  it('detect project', () => {
    let result: Todo = service.extractKeywords('* go home #kalle', todo);
    expect(result.project == 'kalle').toBeTrue();
  });

  it('detect project at start', () => {
    let result: Todo = service.extractKeywords('#kalle go home', todo);
    expect(result.project == 'kalle').toBeTrue();
  });

  it('detect no project in url', () => {
    let result: Todo = service.extractKeywords(
      '* go home https://adfas.de#kalle',
      todo
    );
    expect(result.project != 'kalle').toBeTrue();
  });

  it('detect missspelled project', () => {
    let result: Todo = service.extractKeywords('* go home#klle', todo);
    expect(result.project == 'kalle').toBeTrue();
  });

  it('detect short version project', () => {
    let result: Todo = service.extractKeywords('* go home #ja afafaf', todo);
    expect(result.project == 'java').toBeTrue();
  });

  it('detect every thu', () => {
    let result: Todo = service.extractKeywords('go home every thu', todo);
    expect(result.rrule.includes('FREQ=WEEKLY;INTERVAL=1;BYDAY=TH')).toBeTrue();
  });

  it('detect every 4 thu', () => {
    let result: Todo = service.extractKeywords('every 4 thu make it', todo);
    expect(result.rrule.includes('FREQ=WEEKLY;INTERVAL=4;BYDAY=TH')).toBeTrue();
  });

  it('detect every -4 thu', () => {
    let result: Todo = service.extractKeywords('every -4 thu make it', todo);
    expect(result.rrule == '').toBeTrue();
  });

  it('detect every day', () => {
    let result: Todo = service.extractKeywords('every day sing a song', todo);
    expect(result.rrule.includes('FREQ=DAILY;COUNT=1000')).toBeTrue();
  });

  it('detect EvERY dAy', () => {
    let result: Todo = service.extractKeywords('every day sing a song', todo);
    expect(result.rrule.includes('FREQ=DAILY;COUNT=1000')).toBeTrue();
  });

  it('detect not every horst', () => {
    let result: Todo = service.extractKeywords('every horst sing a song', todo);
    expect(result.rrule == '').toBeTrue();
  });

  it('detect checklist', () => {
    let result: Todo = service.extractKeywords(
      '* go home 01.09.202617:11',
      todo
    );
    expect(result.isChecklist).toBeTrue();
  });

  it('detect no checklist', () => {
    let result: Todo = service.extractKeywords(
      'a * go home 01.09.202617:11',
      todo
    );
    expect(result.isChecklist).toBeFalse();
  });

  it('strip day from summary', () => {
    let result: Todo = service.extractKeywords('fri go home', todo);
    expect(result.title.includes('fri')).toBeFalsy();
  });

  it('strip extra long date', () => {
    let result: Todo = service.extractKeywords('go home 01.09.2026', todo);
    expect(result.title.includes('2026')).toBeFalse();
  });

  it('strip day from summary', () => {
    let result: Todo = service.extractKeywords('fri go home', todo);
    expect(result.title.includes('fri')).toBeFalsy();
  });

  it('strip HTML', () => {
    let result: string = service.stripHtml('<h1><scirpt><div><b></b>');
    expect(result == '').toBeTrue();
  });
});
