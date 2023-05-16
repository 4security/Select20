import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isToday,
  parseISO,
} from 'date-fns';
import { NextcloudService } from '../services/nextcloud.service';
import { Storage } from '@ionic/storage-angular';
import { ParserService } from '../services/parser.service';
import { RegexService } from '../services/regex.service';
import { RruleService } from '../services/rrule.service';
import formatISO from 'date-fns/formatISO';
import { AlertController, IonModal } from '@ionic/angular';
import { Todo } from '../models/todo';
import { Project } from '../models/project';
import { MessageService } from '../services/message.service';
import { Calendar } from '../models/calendar';
import { ActivatedRoute, Router } from '@angular/router';
import { QueueItem } from '../models/queueItem';
import {
  defaultCalendar,
  defaultCurrentProject,
  defaultProjects,
} from '../config';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  todos: Todo[] = [];
  todosCopy: Todo[] = [];
  relatedTodos: Todo[] = [];
  lastChangedTodo: Todo;
  supertaskTodo: Todo;
  lastSubmittedTodo: string = '';
  superTodoText: string = '';

  defaultCalendar: Calendar = defaultCalendar;
  calendars: Calendar[] = [];
  currentProject: Project = defaultCurrentProject;
  projects: Project[] = defaultProjects;
  projectsTitles: string[] = [];
  queueLength: number = 0;

  today: string = 'Loading ...';
  heading: string = 'Loading ...';
  inputNewTodo: string = '';

  @ViewChild('projectPane') projectsPane;
  @ViewChild('buttonsPane') buttonsPane;

  isFABShown: boolean = false;
  isPhoneView: boolean = false;
  isRefreshInProgress: boolean = false;
  isMenuVisible: boolean = false;
  isSyncActive: boolean = false;
  isInSerachMode: boolean = false;

  indexOfLastChangedTodo: number;
  _storage: Storage | null = null;
  syncTest;

  emaillogin: string = "";
  passwordlogin: string = "";
  nameregisterfree: string = "";
  emailregisterfree: string = "";
  passwordregisterfree: string = "";
  nameregisterselfhosted: string = "";
  emailregisterselfhosted: string = "";
  passwordregisterselfhosted: string = "";
  nextcloudurl: string = "";
  nextcloudapi: string = "";

  @ViewChild(IonModal) registerModal: IonModal;
  demoMode: boolean = false;

  constructor(
    private nextcloud: NextcloudService,
    private storage: Storage,
    private parserService: ParserService,
    private syncService: SyncService,
    private regexService: RegexService,
    private rruleService: RruleService,
    private alertController: AlertController,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      if (this.router.getCurrentNavigation().extras.state) {
        this.projects =
          this.router.getCurrentNavigation().extras.state.projects;
      }
    });
    if (window.innerWidth <= 600) {
      this.isFABShown = true;
      this.isPhoneView = true;
    }
  }

  async ngOnInit() {
    const storage = await this.storage.create();
    this._storage = storage;
    if (!this.demoMode) {
      this.sync();
    }
    this.today = format(Date.now(), 'dd.MM.yyyy');

    let offlineSyncBackgroundJob = setInterval(() => {
      this.syncService.startOfflineSync();
    }, 15 * 60000);
  }

  sync() {
    this.isSyncActive = true;
    this.getTodosFromCache();
    this.syncService.startSync();

    this.syncTest = setInterval(() => {
      let syncStatus = this.syncService.getSyncStatus();
      // console.debug("Sync-Status:" + syncStatus);
      if (syncStatus == 'resolved') {
        clearInterval(this.syncTest);
        this.getTodosFromCache();
        this.isSyncActive = false;
      }
      if (syncStatus == 'not authorized' && !this.registerModal.isOpen) {
        clearInterval(this.syncTest);
        this.registerModal.present()
        this.isSyncActive = false;
      }
    }, 200);
  }

  getTodosFromCache() {
    this._storage.get('projects').then((projects: Project[]) => {
      this._storage.get('todos').then(
        (todos: Todo[]) => {
          this._storage.get('relatedTodos').then((relatedTodos: Todo[]) => {
            this.projects = projects;
            this.todos = todos;
            this.todosCopy = todos;
            this.relatedTodos = relatedTodos;

            this.showProjectTodos(this.currentProject);
          });
        },
        (error) => {
          console.error('⭕  Cannot get todos form cache');
        }
      );
      this._storage.get('queue').then(
        (queue: QueueItem[]) => {
          if (queue != null) {
            this.queueLength = queue.length;
          }
        },
        (error) => {
          console.error('⭕  Cannot get queue form cache');
        }
      );
    });
  }

  showMenu() {
    this.leaveSubTaskMode();
    if (window.innerWidth <= 600) {
      this.isFABShown = true;
      if (this.isMenuVisible) {
        this.buttonsPane.nativeElement.style.left = '-100vw';
        this.projectsPane.nativeElement.style.left = '-100vw';
      } else {
        this.buttonsPane.nativeElement.style.left = '2.5vw';
        this.projectsPane.nativeElement.style.left = '2.5vw';
      }
    }
    this.isMenuVisible = !this.isMenuVisible;
  }

  showNewInput() {
    if (this.isMenuVisible) {
      this.showMenu();
    }
    this.isFABShown = !this.isFABShown;
  }

  createNewTodo(): void {
    let text = this.regexService.stripHtml(this.inputNewTodo);

    let newUid: string =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // allow creation of today task at 00:00 --> now() -1
    let todo: Todo = {
      icsid: newUid,
      uid: newUid,
      title: 'default',
      priority: 4,
      description: '',
      created: this.regexService.formatIcsDate(Date.now()),
      modified: this.regexService.formatIcsDate(Date.now()),
      startdate: this.regexService.formatIcsDate(addDays(Date.now(), -1)),
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
      project: this.currentProject,
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      subs: [],
    };
    let newTodo: Todo = this.regexService.extractKeywords(text, todo);

    if (this.parserService.checkTodoForLogic(todo)) {
      if (this.superTodoText != '') {
        let indexSuperTodo: number = this.todos.indexOf(this.supertaskTodo);
        todo.related = this.supertaskTodo.uid;
        this.todos[indexSuperTodo].subs.push(todo);
      } else {
        this.todos.unshift(newTodo);
      }
      this._storage.set('todos', this.todos);
      this.updateTodo(newTodo, todo.project);
      this.inputNewTodo = '';
    }
  }

  toggleTodo(todo: Todo) {
    let superTodo = this.todos.find((ctrtodo) => ctrtodo.uid == todo.related);
    this.indexOfLastChangedTodo = this.todos.indexOf(todo);
    this.lastChangedTodo = { ...todo };

    // Cannot remove of checklists
    if (todo.isChecklist) {
      this.messageService.show('🔏 Checklists stay - ' + todo.title, true);

      // Hide todos in checklist and do not update in backend
    } else if (superTodo != null && superTodo.isChecklist) {
      this.messageService.show('🙈 Hide checklist todo');
      todo.isVisible = false;
    } else {
      // Rrules cannot be toggled
      if (todo.rrule != '') {
        this.messageService.show('👍 Calculate next event of ' + todo.title);
        this.toogleRrule(todo, this.indexOfLastChangedTodo);

        // Toogle normal todos
      } else {
        this.messageService.show('👍 Finish todo ' + todo.title);

        todo.status = 'COMPLETED';
        todo.isVisible = false;

        this.todos[this.indexOfLastChangedTodo] = todo;

        this.updateTodo(todo, todo.project, true);
        this.todos = this.todos.filter((item) => item !== todo);
        this._storage.set('todos', this.todos);
      }
    }

    if (todo.isChecklist) {
      todo.isVisible = true;
    }
  }

  undo() {
    if (this.lastChangedTodo != null && this.indexOfLastChangedTodo != null) {
      this.nextcloud
        .pushTodo(
          this.currentProject,
          this.lastChangedTodo,
          this.parserService.parseTodoToIcal(this.lastChangedTodo),
          false
        )
        .subscribe({
          next: (result) => {
            // console.log('Undo todo', this.lastChangedTodo.title);
            this.messageService.show('💾 Undo Change');
            this.todos[this.indexOfLastChangedTodo] = this.lastChangedTodo;
          },
          error: (error) => {
            this.messageService.show('Error Undo Change' + error, true);
            console.error(
              '⭕ Error Undo Change',
              this.lastChangedTodo.title,
              error
            );
          },
        });
    } else {
      this.messageService.show('No recent task to undo', true);
    }
  }

  showHiddenProjects() {
    this.projects.forEach((project) => {
      project.visible = true;
    });
  }

  addProject() {
    this.storage.set('currentproject', "");
    this.router.navigate(['/project']);

  }

  toogleRrule(todo: Todo, indexOfTodo: number): void {
    let regexNextEvent = /\;?NEXTEVENT=([0-9T]{15})/g;
    let rawNextEvent = regexNextEvent.exec(todo.description);
    let mynextEvent;

    if (rawNextEvent !== null) {
      mynextEvent = this.rruleService.calculateNextEvent(todo, rawNextEvent[1]);
    } else {
      mynextEvent = this.rruleService.calculateNextEvent(todo, 'nonextevent');
    }

    todo.due = formatISO(mynextEvent, { format: 'basic' }).replace(
      /\+\d\d\:00/g,
      ''
    );
    todo.description = todo.description.replace(
      /\;?NEXTEVENT=[0-9T]{15}/g,
      ';NEXTEVENT=' + todo.due
    );
    if (!todo.description.includes('NEXTEVENT=')) {
      todo.description += ';NEXTEVENT=' + todo.due;
    }
    this.updateTodo(todo, todo.project);
    todo.isVisible = false;
    this.todos[indexOfTodo] = todo;
  }

  changeSummary(summary, todo: Todo) {
    let oldProject = todo.project;

    this.lastChangedTodo = { ...todo };
    this.indexOfLastChangedTodo = this.todos.indexOf(todo);
    let text: string = this.regexService
      .stripHtml(summary.target.innerHTML)
      .replace('\n', '')
      .replace('<br>', '');
    let originalTodo: string = text;
    let extractedTodo: Todo = this.regexService.extractKeywords(text, todo);

    if (text.match(/[e|E]very\s\d?\s?(mon|tue|wed|thu|fri|sat|sun)/i)?.input) {
      extractedTodo.description = extractedTodo.description.replace(
        /;NEXTEVENT=[^;]+/g,
        ''
      );
      this.toogleRrule(extractedTodo, this.indexOfLastChangedTodo);
    }

    if (this.parserService.checkTodoForLogic(extractedTodo)) {
      this.updateTodo(extractedTodo, extractedTodo.project);

      if (extractedTodo.project != oldProject) {
        console.log(
          'Move from ' + oldProject + ' project ' + extractedTodo.project
        );
        this.lastChangedTodo.status = 'COMPLETED';
        this.updateTodo(this.lastChangedTodo, oldProject, true);
      }
      extractedTodo.status = 'NEEDS-ACTION';
      extractedTodo.isVisible = true;

      this._storage.set('todos', this.todos);
      summary.target.innerHTML = extractedTodo.title;
    } else {
      summary.target.innerHTML = originalTodo
        .replace('<div>', '')
        .replace('</div>', '')
        .replace('<br>', '')
        .replace('\n', '');
    }
  }

  addSubtask(todo: Todo) {
    if (window.innerWidth <= 600) {
      this.showNewInput();
    }
    this.superTodoText = todo.title;
    this.supertaskTodo = todo;
  }

  leaveSubTaskMode(): void {
    this.superTodoText = '';
    this.supertaskTodo = null;
  }

  updateTodo(todo: Todo, project: Project, isDeleted: boolean = false) {
    if (this.superTodoText != '') {
      todo.related = this.supertaskTodo.uid;
    }
    if (todo.rrule != undefined && todo.rrule.length > 5 && todo.due == '') {
      todo.due = this.regexService
        .formatIcsDate(addDays(Date.now(), 1))
        .replace(/\d{6}$/, '000000');
    }

    let newRawTodo: string = this.parserService.parseTodoToIcal(todo);

    // use inbox if not project is selected


    todo.title = todo.title.trim();
    if (!this.demoMode) {
      this.nextcloud
        .pushTodo(project, todo, newRawTodo, isDeleted)
        .subscribe({
          next: (resultCreation: string) => {
            if (resultCreation == '') {
              if (isDeleted) {
                this.messageService.show('👍 Finish todo ' + todo.title);
              } else if (
                project == null ||
                project.url == '' ||
                isDeleted ||
                todo.rrule != '' ||
                todo.due == null ||
                todo.due.includes('000000') ||
                todo.due == ''
              ) {
                this.messageService.show('💾 Saved');
              } else {
                this.messageService.show(
                  '💾 Saved + 📅 Sheduled in ' +
                  project.calendar.name +
                  ' for ' +
                  todo.duration +
                  'm'
                );
              }
              this.parserService.showNextEventOfRrule(todo);
              this._storage.set('todos', this.todos);
              return true;
            } else {
              console.error('⭕ Sabre Error', resultCreation);
              this.messageService.show('⭕ Sabre Error - ' + resultCreation);
              return false;
            }
          },
          error: (error) => {
            const STATUS_CODE_OFFLINE = 0;

            if (error.status == STATUS_CODE_OFFLINE) {
              let saveOffline: QueueItem = new QueueItem();
              saveOffline.project = project;
              saveOffline.todo = todo;
              saveOffline.raw = newRawTodo;
              this.syncService.addToQueue(saveOffline);
            }

            return false;
          },
        });
    }
  }

  getColor(todo: Todo): string {
    if (todo.status == 'COMPLETED') {
      return 'grey';
    }
    switch (todo.priority) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'blue';
      default:
        return 'white';
    }
  }

  formatDate(todo: Todo): string {
    return this.parserService.formatDateForInterface(todo);
  }

  showProjectTodos(project: Project) {
    this.heading = project.title;
    this.currentProject = project;

    this.leaveSubTaskMode();
    if (this.isInSerachMode) {
      this.leaveSearchMode();
    }
    if (this.relatedTodos != null) {
      this.relatedTodos.forEach((relatedTodo) => {
        if (relatedTodo.due != '') {
          this.todos = this.todos.filter(
            (data) => data.icsid != relatedTodo.icsid
          );
          switch (project.title) {
            case '🔴 Today':
              this.todos.push(relatedTodo);
              break;
            case '📅 Upcomming':
              this.todos.push(relatedTodo);
              break;
            default:
              break;
          }
        }
      });
    }
    if (this.todos != null) {
      this.todos.forEach((todo: Todo) => {
        switch (project.title) {
          case '🔴 Today':
            if (
              isToday(parseISO(todo.due)) ||
              (isBefore(parseISO(todo.due), Date.now()) &&
                todo.status != 'COMPLETED')
            ) {
              todo.isVisible = true;
            } else {
              todo.isVisible = false;
            }
            break;
          case '📅 Upcomming':
            if (
              isAfter(parseISO(todo.due), Date.now()) &&
              todo.due != '' &&
              todo.status != 'COMPLETED'
            ) {
              todo.isVisible = true;
            } else {
              todo.isVisible = false;
            }
            break;
          default:
            if (this.currentProject.url == todo.project.url && todo.status != 'COMPLETED') {
              todo.isVisible = true;
            } else {
              todo.isVisible = false;
            }
            break;
        }
      });
    }

    switch (project.title) {
      case '🔴 Today':
        this.sortByTime();
        break;
      case '📅 Upcomming':
        this.sortByTime();
        break;
      default:
        this.sortByPrio();
        break;
    }

    if (window.innerWidth <= 600) {
      this.buttonsPane.nativeElement.style.left = '-100vw';
      this.projectsPane.nativeElement.style.left = '-100vw';
    }
  }

  sortByTime() {
    if (this.todos != null) {
      this.todos.sort(function (a, b) {
        return a.dueUNIX - b.dueUNIX || b.createdUNIX - a.createdUNIX;
      });
    }
  }

  sortByPrio() {
    if (this.todos != null) {
      // sort first for prio than abc
      this.todos.sort((a, b) => {
        return a.priority - b.priority || b.createdUNIX - a.createdUNIX;
      });
    }
  }

  updateProject(project: Project): void {
    this.storage.set('currentproject', project);
    this.router.navigate(['/project']);
  }

  async deleteDueDate(todo: Todo) {
    if (!this.currentProject.title.includes('Today')) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Remove Due?',
        message: 'Confirm to remove due and recurring rule',

        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: 'Submit',
            handler: () => {
              let regexEnd: RegExp = /;ENDCAL=[0-9T]{15}/g;

              todo.due = '';
              todo.rrule = '';
              todo.enddate = '';
              todo.duration = 30;
              todo.description = todo.description.replace(regexEnd, '');
              this.updateTodo(todo, this.currentProject, false);
            },
          },
        ],
      });
      await alert.present();
    }
  }

  refreshCircle(event) {
    this.refresh();
    setTimeout(() => {
      event.target.complete();
    }, 6000);
  }

  refresh() {
    if (!this.isRefreshInProgress) {
      this.leaveSubTaskMode();
      this.sync();
    }
  }

  addDescription(todo: Todo) { }

  getURL(summary: string) {
    let url = 'none';
    try {
      url = summary.match(/(https?:\/\/[^ ]*)/)[1];
    } catch (error) { }

    return url;
  }

  logout() {
    clearInterval(this.syncTest);
    this.nextcloud.logout().subscribe((data) => {
      console.log("✅ Logged out!");
      this.messageService.show("You are logged out!");

    });
    this._storage.clear();
    this.isSyncActive = false;
    this.projects = [];
    this.todos = [];
  }

  switchSearchMode() {
    this.isInSerachMode = !this.isInSerachMode;
    if (!this.isInSerachMode) {
      this.getTodosFromCache();
      this.showProjectTodos(this.currentProject);
    } else {
      if (window.innerWidth <= 600) {
        this.showMenu();
        this.showNewInput();
      }
    }
  }

  leaveSearchMode() {
    this.getTodosFromCache();
    this.showProjectTodos(this.currentProject);
  }

  search(): void {
    if (this.isInSerachMode) {
      let term = this.inputNewTodo;
      this.todosCopy.forEach((todo) => {
        todo.isVisible = true;
      });
      this.todos = this.todosCopy.filter(function (tag) {
        return tag.title.indexOf(term) >= 0;
      });
    }
  }

  login() {
    this.nextcloud.login(this.emaillogin, this.passwordlogin).subscribe({
      next: (loginResults) => {
        console.log('✅ Credentials correct');
        this.sync();
        this.registerModal.dismiss();
      },
      error: (error) => {
        console.error('Credentials not correct', JSON.stringify(error));
        this.messageService.show('⭕ Credentials not correct');
      },
    });

  }

  startDemoMode() {
    this.todos = [];
    this.projects = defaultProjects;
    let exampleProjects = ["🏡 Home", "💼 Office", "🌅 Travel", "🏀 Gym", "🍒 Groceries"]
    exampleProjects.forEach(element => {
      let project = structuredClone(defaultProjects[0]);
      console.log(element);
      project.url = element;
      project.title = element;
      this.projects.push(project);
    });
    this.storage.set("projectTitles", ["📥 Inbox", "🔴 Today", "📅 Upcomming", "🏡 Home", "💼 Office", "🌅 Travel", "🏀 Gym", "🍒 Groceries"]);
    this.storage.set('calendars', [defaultCalendar]);
    this.registerModal.dismiss();
    console.log('✅ Demo Mode active');
    this.demoMode = true;
  }

  registerFree() {

  }

  registerSelfhosted() {
    this.nextcloud
      .register(
        this.nameregisterselfhosted,
        this.emailregisterselfhosted,
        this.passwordregisterselfhosted,
        this.nextcloudurl,
        this.nextcloudapi
      )
      .subscribe({
        next: (loginResults) => {
          this.sync();
          this.messageService.show("Register successful. Login now!");
        },
        error: (error) => {
          this.messageService.show(
            'Error register - validate your inputs'
          );
        },
      });
  }
}
