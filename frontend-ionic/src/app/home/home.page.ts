import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { AlertController, IonItem } from "@ionic/angular/standalone";
import { ParserService } from '../services/parser.service';
import { RegexService } from '../services/regex.service';
import { RruleService } from '../services/rrule.service';
import { formatISO } from 'date-fns/formatISO';
import { Todo } from '../models/todo';
import { Project } from '../models/project';
import { MessageService } from '../services/message.service';
import { Calendar } from '../models/calendar';
import { QueueItem } from '../models/queueItem';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonButtons, IonFabButton, IonFab, IonIcon, IonModal } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import {
  defaultCalendar,
  defaultCurrentProject,
  defaultProjects,
} from '../config';
import { SyncService } from '../services/sync.service';
import { addIcons } from "ionicons";
import { add, addCircle, addOutline, arrowUndo, calendar, close, ellipsisHorizontal, help, hourglass, link, logOut, menu, pricetag, repeat, search, refresh, eye, cloudOffline, checkbox, trash } from 'ionicons/icons';
import { NgForOf, NgIf } from "@angular/common";




@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  providers: [Storage, ParserService, RegexService, RruleService, MessageService, NextcloudService, SyncService],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, FormsModule, IonButtons, IonFabButton, IonFab, IonIcon, NgForOf, NgIf, IonModal, IonIcon, IonItem, IonModal,],
})
export class HomePage implements OnInit {
  todos: Todo[] = [];
  todosCopy: Todo[] = [];
  relatedTodos: Todo[] = [];
  defaultTodo: Todo = {
    icsID: "xxxxxxxxxxxxxxxxxxx",
    uid: "xxxxxxxxxxxxxxxxxxxxx",
    title: 'default',
    priority: 4,
    description: '',
    created: this.regexService.formatIcsDate(Date.now()),
    modified: this.regexService.formatIcsDate(Date.now()),
    startDate: this.regexService.formatIcsDate(addDays(Date.now(), -1)),
    due: '',
    dueUNIX: 0,
    createdUNIX: 0,
    categories: '',
    status: 'NEEDS-ACTION',
    percent: 0,
    raw: '',
    endDate: '',
    rrule: '',
    duration: 30,
    related: '',
    project: defaultProjects[0],
    isVisible: true,
    isChecklist: false,
    isOverdue: false,
    tags: [],
    subs: [],
  };
  lastChangedTodo: Todo = this.defaultTodo;
  superTaskTodo: Todo = this.defaultTodo;
  lastSubmittedTodo: string = '';
  superTodoText: string = '';
  refreshIcon: string = 'refresh';
  newProjectName: string = "";
  isLoginScreenOpen: boolean = false;

  defaultCalendar: Calendar = defaultCalendar;
  calendars: Calendar[] = [];
  currentProject: Project = defaultCurrentProject;
  projectTitles: String[] = [];
  projects: Project[] = defaultProjects;
  tags: string[] = [];
  queueLength: number = 0;

  today: string = 'Loading ...';
  heading: string = 'Loading ...';
  inputNewTodo: string = '';

  @ViewChild('projectPane') projectsPane: any;
  @ViewChild('buttonsPane') buttonsPane: any;

  isFABShown: boolean = false;
  isPhoneView: boolean = false;
  isRefreshInProgress: boolean = false;
  isMenuVisible: boolean = false;
  isSyncActive: boolean = false;
  isInSearchMode: boolean = false;

  indexOfLastChangedTodo: number = 0;
  _storage: Storage | null = null;
  syncTest: any;

  emailLogin: string = "";
  passwordLogin: string = "";
  nameRegisterFree: string = "";
  emailRegisterFree: string = "";
  passwordRegisterFree: string = "";
  nameRegisterSelfHosted: string = "";
  emailRegisterSelfHosted: string = "";
  passwordRegisterSelfHosted: string = "";
  nextcloudUrl: string = "";
  nextcloudAPI: string = "";


  demoMode: boolean = false;
  isModalOpen: boolean = false;

  constructor(
    private nextcloud: NextcloudService,
    private storage: Storage,
    private parserService: ParserService,
    private syncService: SyncService,
    private regexService: RegexService,
    private rruleService: RruleService,
    private alertController: AlertController,
    private messageService: MessageService,
    public cd: ChangeDetectorRef
  ) {
    addIcons({ menu, help, search, calendar, close, pricetag, addOutline, link, repeat, hourglass, addCircle, ellipsisHorizontal, refresh, cloudOffline, arrowUndo, logOut, add, eye, checkbox, trash });
    if (window.innerWidth <= 600) {
      this.isFABShown = true;
      this.isPhoneView = true;
    }

  }

  ionViewWillEnter() {
    this.getTodosFromCache();
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
    this.syncService.noInternet().then((offline) => {
      if (offline) {
        this.refreshIcon = "cloud-offline";
      }
    });
  }

  sync() {
    this.isSyncActive = true;
    this.getTodosFromCache();
    this.syncService.startSync();

    this.syncTest = setInterval(() => {
      let syncStatus = this.syncService.getSyncStatus();
      this.isModalOpen = false;
      if (syncStatus == 'offline') {
        this.updateQueueLength();
        clearInterval(this.syncTest);
        this.isSyncActive = false;
      }
      if (syncStatus == 'resolved') {
        clearInterval(this.syncTest);
        this.updateQueueLength();
        this.getTodosFromCache();
        this.isSyncActive = false;
      }
      if (syncStatus == 'timeout') {
        clearInterval(this.syncTest);
        this.messageService.show("⭕ Connectivity issues")
        this.isSyncActive = false;
      }
      if (syncStatus == 'not authorized') {
        clearInterval(this.syncTest);
        this.isLoginScreenOpen = true;
        this.isSyncActive = false;
      }
    }, 200);
  }

  getTodosFromCache() {
    this._storage?.get('projectTitles').then((projectTitles: String[]) => {
      this._storage?.get('projects').then((projects: Project[]) => {
        this._storage?.get('tags').then((tags: string[]) => {
          this._storage?.get('todos').then((todos: Todo[]) => {
            this._storage?.get('relatedTodos').then((relatedTodos: Todo[]) => {
              this.projectTitles = projectTitles;
              this.projects = projects;
              this.tags = tags;
              this.todos = todos;
              this.todosCopy = todos;
              this.relatedTodos = relatedTodos;

              this.showProjectTodos(this.currentProject);
            });
          }
          );
          this.updateQueueLength();
        });
      });
    });
  }

  updateQueueLength() {
    this._storage?.get('queue').then(
      (queue: QueueItem[]) => {
        if (queue != null) {
          this.queueLength = queue.length;
        }
      },
      (error: any) => {
        console.error('⭕ Cannot get queue form cache');
      }
    );
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

  extractTextFromInput(summary: any): void {
    let text = this.regexService.stripHtml(summary.srcElement.value);
    this.createNewTodo(text);
    summary.srcElement.value = this.regexService.stripHtml(summary.srcElement.value);
    summary.srcElement.value = '';
  }



  createNewTodo(text: string) {

    let newUid: string =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Allow creation of today task at 00:00 --> now() - 1
    let todo: Todo = {
      icsID: newUid,
      uid: newUid,
      title: 'default',
      priority: 4,
      description: '',
      created: this.regexService.formatIcsDate(Date.now()),
      modified: this.regexService.formatIcsDate(Date.now()),
      startDate: this.regexService.formatIcsDate(addDays(Date.now(), -1)),
      due: '',
      dueUNIX: 0,
      createdUNIX: 0,
      categories: '',
      status: 'NEEDS-ACTION',
      percent: 0,
      raw: '',
      endDate: '',
      rrule: '',
      duration: 30,
      related: '',
      project: this.currentProject,
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      tags: [],
      subs: [],
    };
    let newTodo: Todo = this.regexService.extractKeywords(text, todo, this.projects, this.projectTitles);
    newTodo = this.addNextEventWhenRrule(newTodo);
    if (this.parserService.checkTodoForLogic(todo)) {
      if (this.superTodoText != '') {
        let indexSuperTodo: number = this.todos.indexOf(this.superTaskTodo);
        todo.related = this.superTaskTodo.uid;
        this.todos[indexSuperTodo].subs.push(todo);
      } else {
        this.todos.unshift(newTodo);
      }
      this._storage?.set('todos', this.todos);
      this.updateTodo(newTodo, todo.project);
    }
  }

  addNextEventWhenRrule(todo: Todo) {
    if (todo.rrule.includes("FREQ")) {
      let theNextEvent = this.rruleService.calculateNextEvent(todo, 'NoNextEvent');
      todo.due = formatISO(theNextEvent, { format: 'basic' }).replace(
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
    }
    return todo;
  }

  toggleTodo(todo: Todo) {
    let superTodo = this.todos.find((ctrTodo) => ctrTodo.uid == todo.related);
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
      // Recurring rules cannot be toggled
      if (todo.rrule != '') {
        this.messageService.show('👍 Calculate next event of ' + todo.title);
        this.toggleRrule(todo, this.indexOfLastChangedTodo);

        // Toggle for normal todos
      } else {
        this.messageService.show('👍 Finish todo ' + todo.title);
        ;
        todo.status = 'COMPLETED';
        todo.isVisible = false;

        this.todos[this.indexOfLastChangedTodo] = todo;

        this.updateTodo(todo, todo.project, true);
        this.todos = this.todos.filter((item) => item !== todo);
        this._storage?.set('todos', this.todos);
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
          next: (todoAnswer: string) => {
            if (todoAnswer == "") {
              this.messageService.show('💾 Undo Change');
              this.todos[this.indexOfLastChangedTodo] = this.lastChangedTodo;

            } else {
              this.messageService.show('Sabre Error Undo Change' + todoAnswer, true);
              console.error(
                '⭕ Sabre Error Undo Change',
                todoAnswer
              );
            }

          },
          error: (error: any) => {
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




  toggleRrule(todo: Todo, indexOfTodo: number): void {
    let regexNextEvent = /\;?NEXTEVENT=([0-9T]{15})/g;
    let rawNextEvent = regexNextEvent.exec(todo.description);
    let theNextEvent;

    if (rawNextEvent !== null) {
      theNextEvent = this.rruleService.calculateNextEvent(todo, rawNextEvent[1]);
    } else {
      theNextEvent = this.rruleService.calculateNextEvent(todo, 'NoNextEvent');
    }

    todo.due = formatISO(theNextEvent, { format: 'basic' }).replace(
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

  changeSummary(summary: any, todo: Todo) {
    let oldProject = todo.project;

    this.lastChangedTodo = { ...todo };
    this.indexOfLastChangedTodo = this.todos.indexOf(todo);
    let text: string = this.regexService
      .stripHtml(summary.target.innerHTML)
      .replace('\n', '')
      .replace('<br>', '');
    let originalTodo: string = text;
    let extractedTodo: Todo = this.regexService.extractKeywords(text, todo, this.projects, this.projectTitles);

    if (text.match(/[e|E]very\s\d?\s?(mon|tue|wed|thu|fri|sat|sun)/i)?.input) {
      extractedTodo.description = extractedTodo.description.replace(
        /;NEXTEVENT=[^;]+/g,
        ''
      );
      this.toggleRrule(extractedTodo, this.indexOfLastChangedTodo);
    }

    if (this.parserService.checkTodoForLogic(extractedTodo)) {
      this.updateTodo(extractedTodo, extractedTodo.project);

      if (extractedTodo.project != oldProject) {
        console.log(
          '✅ Move from ' + oldProject + ' project ' + extractedTodo.project
        );
        this.lastChangedTodo.status = 'COMPLETED';
        this.updateTodo(this.lastChangedTodo, oldProject, true);
      }
      extractedTodo.status = 'NEEDS-ACTION';
      extractedTodo.isVisible = true;

      this._storage?.set('todos', this.todos);
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
    this.superTaskTodo = todo;
  }

  leaveSubTaskMode(): void {
    this.superTodoText = '';
    this.superTaskTodo = this.defaultTodo;
  }

  updateTodo(todo: Todo, project: Project, isDeleted: boolean = false) {
    if (this.superTodoText != '') {
      todo.related = this.superTaskTodo.uid;
    }
    if (todo.rrule != undefined && todo.rrule.length > 5 && todo.due == '') {
      todo.due = this.regexService
        .formatIcsDate(addDays(Date.now(), 1))
        .replace(/\d{6}$/, '000000');
    }

    let newRawTodo: string = this.parserService.parseTodoToIcal(todo);

    // Use the inbox if not project is selected as default

    todo.title = todo.title.trim();
    if (!this.demoMode) {
      this.nextcloud
        .pushTodo(project, todo, newRawTodo, isDeleted)
        .subscribe({
          next: (todoAnswer: string) => {
            if (todoAnswer == '') {
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
                  '💾 Saved + 📅 Scheduled in ' +
                  defaultCalendar.name +
                  ' for ' +
                  todo.duration +
                  'm'
                );

              }

              this.parserService.showNextEventOfRrule(todo);
              this._storage?.set('todos', this.todos);
              return true;
            } else {
              console.error('⭕ Sabre Error', todoAnswer);
              this.messageService.show('⭕ Sabre Error - ' + todoAnswer);
              return false;
            }
          },
          error: (error: any) => {
            const STATUS_CODE_OFFLINE = 0;

            if (error.status == STATUS_CODE_OFFLINE) {
              let saveOffline: QueueItem = new QueueItem();
              saveOffline.project = project;
              saveOffline.todo = todo;
              saveOffline.raw = newRawTodo;
              this.syncService.addToQueue(saveOffline);
              this.queueLength++;
            }

            return false;
          }
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
        return 'var(--font)';
    }
  }

  formatDate(todo: Todo): string {
    return this.parserService.formatDateForInterface(todo);
  }

  showTag(tag: string) {
    this.todos.forEach((todo: Todo) => {
      if (todo.tags.includes(tag)) {
        todo.isVisible = true;
      } else {
        todo.isVisible = false;
      }
    });
  }

  showProjectTodos(project: Project) {
    this.heading = project.title;
    this.currentProject = project;

    this.leaveSubTaskMode();
    if (this.isInSearchMode) {
      this.leaveSearchMode();
    }
    if (this.relatedTodos != null) {
      this.relatedTodos.forEach((relatedTodo) => {
        if (relatedTodo.due != '') {
          this.todos = this.todos.filter(
            (data) => data.icsID != relatedTodo.icsID
          );
          switch (project.title) {
            case '🔴 Today':
              this.todos.push(relatedTodo);
              break;
            case '📅 Upcoming':
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
          case '📅 Upcoming':
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
      case '📅 Upcoming':
        this.sortByTime();
        break;
      default:
        this.sortByPriority();
        break;
    }
    this.cd.detectChanges()

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

  sortByPriority() {
    if (this.todos != null) {
      // Sort first for priority than alphabetic
      this.todos.sort((a, b) => {
        return a.priority - b.priority || b.createdUNIX - a.createdUNIX;
      });
    }
  }

  saveProject(): void {
    if (this.currentProject.title == "New") {
      this.submitNewProject();
    } else {
      this.renameProject();
    }
  }

  renameProject() {
    if (this.newProjectName.length > 3) {
      this.nextcloud.renameProject(this.currentProject.url, this.newProjectName).subscribe({
        next: (renameAnswer: string) => {
          console.log(renameAnswer);
          this.refresh();
          this.currentProject.title = this.newProjectName;
          this.isModalOpen = false;
        }
      });
    } else {
      this.messageService.show("Project name to short", true);
    }
  }

  async deleteProject() {
    const alert = await this.alertController.create({
      header: 'Remove Project?',
      message: 'Confirm to remove project ' + this.currentProject.title,

      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Delete',
          handler: () => {
            this.nextcloud.deleteProject(this.currentProject.url).subscribe({
              next: (deleteAnswer: string) => {
                console.log(deleteAnswer);
                this.refresh();
                this.isModalOpen = false;
              }
            });
          },
        },
      ],
    });
    await alert.present();
  }

  addProject() {
    this.isModalOpen = true;
    this.currentProject.title = "New";
  }

  submitNewProject() {
    if (this.newProjectName.length > 3) {
      this.nextcloud.createProject(this.newProjectName).subscribe({
        next: (createAnswer: string) => {
          console.log(createAnswer);
          this.refresh();
          this.isModalOpen = false;
        }
      });
    } else {
      this.messageService.show("Project name to short", true);
    }
  }

  cancel() {
    this.isModalOpen = false;
  }

  openModal(project: Project) {
    this.isModalOpen = true;
    this.currentProject = project;
  }

  async deleteDueDate(todo: Todo) {
    if (!this.currentProject.title.includes('Today')) {
      const alert = await this.alertController.create({
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
              todo.endDate = '';
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

  async deleteTag(todo: Todo, tag: string) {

    const alert = await this.alertController.create({
      header: 'Remove Tag?',
      message: 'Confirm to remove tag ' + tag + '?',

      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Submit',
          handler: () => {
            todo.tags = todo.tags.filter(e => e !== tag)
            todo.description = todo.description.replace(tag, '');
            this.updateTodo(todo, this.currentProject, false);
          },
        },
      ],
    });
    await alert.present();

  }


  refreshCircle(event: any) {
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

  getURL(summary: any) {
    let url = 'none';
    try {
      url = summary.match(/(https?:\/\/[^ ]*)/)[1];
    } catch (error) { }

    return url;
  }

  logout() {
    clearInterval(this.syncTest);
    this.nextcloud.logout().subscribe((data: any) => {
      console.log("✅ Logged out!");
      this.messageService.show("You are logged out!");

    });
    this._storage?.remove("projects");
    this._storage?.clear();
    this.isSyncActive = false;
    this.projects = [];
    this.todos = [];
    this.isLoginScreenOpen = true;
  }

  switchSearchMode() {
    this.isInSearchMode = !this.isInSearchMode;
    if (!this.isInSearchMode) {
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

  search(summary: any): void {
    if (this.isInSearchMode) {
      let term = this.regexService.stripHtml(summary.target.innerHTML);
      this.todosCopy.forEach((todo) => {
        todo.isVisible = true;
      });
      this.todos = this.todosCopy.filter(function (tag) {
        return tag.title.indexOf(term) >= 0;
      });
    }
  }

  login() {
    this.nextcloud.login(this.emailLogin, this.passwordLogin).subscribe({
      next: (loginAnswer: any) => {
        console.log('✅ Credentials correct', loginAnswer);
        this.syncService.parseSettings(JSON.parse(loginAnswer.settings));
        this.sync();
        this.isLoginScreenOpen = false;

      },
      error: (error: any) => {
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
      project.url = element;
      project.title = element;
      this.projects.push(project);
      let calendar = structuredClone(defaultCalendar);
      calendar.name = element;
      this.calendars.push(calendar);
    });
    this.storage.set("projects", this.projects);
    this.storage.set("projectTitles", ["📥 Inbox", "🔴 Today", "📅 Upcoming", "🏡 Home", "💼 Office", "🌅 Travel", "🏀 Gym", "🍒 Groceries"]);
    this.storage.set('calendars', this.calendars);
    this.isLoginScreenOpen = false;
    this.todos = [];
    console.log('✅ Demo Mode active');
    this.demoMode = true;
  }

  registerFree() {

  }

  registerSelfHosted() {
    this.nextcloud
      .register(
        this.nameRegisterSelfHosted,
        this.emailRegisterSelfHosted,
        this.passwordRegisterSelfHosted,
        this.nextcloudUrl,
        this.nextcloudAPI
      )
      .subscribe({
        next: (loginAnswer: any) => {
          this.sync();
          console.log("Login Self hosted worked", loginAnswer)
          this.messageService.show("Register successful. Login now!");
        },
        error: (error: any) => {
          console.error("Self hosting login failed", error)
          this.messageService.show(
            'Error register - validate your inputs'
          );
        },

      });
  }
}
