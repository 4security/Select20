import { Injectable } from '@angular/core';
import { MessageService } from './message.service';
import { NextcloudService } from './nextcloud.service';
import { ParserService } from './parser.service';
import { DOMParserImpl as dom } from 'xmldom-ts';
import * as xpath from 'xpath-ts';
import { Project } from '../models/project';
import { Calendar } from '../models/calendar';
import { defaultProjects, nextcloudUser } from '../config';
import { Todo } from '../models/todo';
import { Storage } from '@ionic/storage-angular';
import noInternet from 'no-internet';
import { QueueItem } from '../models/queueItem';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  todos: Todo[] = [];
  tags: String[] = [];
  relatedTodos: Todo[] = [];
  newTodos: Todo[] = [];
  newRelatedTodos: Todo[] = [];
  timeForSync: number;
  queue: QueueItem[] = [];
  projects: Project[] = defaultProjects;
  projectTitles: string[] = [];
  queueLength: number;
  calendars: Calendar[] = [];
  syncActive = false;
  syncStatus: string = 'initial';
  isLoginOpen: boolean = false;
  superTimeout: any;

  constructor(
    private nextcloud: NextcloudService,
    private parserService: ParserService,
    private alertController: AlertController,
    private storage: Storage,
    private messageService: MessageService
  ) { }

  startSync() {
    noInternet().then((offline) => {
      if (offline) {
        this.syncActive = false;
        this.syncStatus = 'offline';
      } else {
        if (!this.syncActive) {
          console.log('🔁 Sync started');
          this.syncStatus = 'running';
          this.syncActive = true;
          this.calendars = [];
          this.timeForSync = performance.now();
          this.storage
            ?.get('projects')
            .then((projects) => {
              this.projects = projects;
              this.getProjectsAddNewOnes();
              this.startOfflineSync();
              this.startTimeout();
            })
            .catch((err) => {
              this.projects = defaultProjects;
              this.getProjectsAddNewOnes();
            });
        } else {
          console.log('🔁 Sync currently in progress');
        }
      }
    });

  }

  startTimeout() {
    this.superTimeout = setTimeout(() => {
      this.newTodos = [];
      this.newRelatedTodos = [];
      this.syncStatus = 'timeout';
      this.syncActive = false;
      console.log(
        '⭕ Timeout '
      );
    }, 15000);
  }

  public getSyncStatus(): string {
    return this.syncStatus;
  }

  public startOfflineSync() {
    console.log('🔁 Offline sync started');
    this.storage.get('queue').then((queueItems: QueueItem[]) => {
      if (queueItems != null) {
        queueItems.forEach((queueItem: QueueItem, queueIndex: number) => {
          this.nextcloud
            .pushTodo(
              queueItem.project,
              queueItem.todo,
              queueItem.raw,
              false
            )
            .subscribe({
              next: (answerOfflineTodoSynced: string) => {
                console.log(
                  '✅ Push Offline todo ',
                  queueItem.todo.title,
                  answerOfflineTodoSynced
                );
                if (answerOfflineTodoSynced == "") {
                  console.log(queueIndex);
                  this.queue.splice(queueIndex, 1);
                  this.storage.set('queue', this.queue);
                }
                this.messageService.show('💾 Sync Offline Todo');
                this.queueLength = this.queue.length;
              },
              error: (error) => {
                this.messageService.show('Error Sync Offline Todo', true);
                console.error(
                  '⭕ Error Push offline todo',
                  queueItem.todo.title,
                  error
                );
              },
            });
        });
      }
    });

  }

  getProjectsAddNewOnes(): void {
    this.nextcloud.getProjects().subscribe({
      next: (xmlDocu: string) => {
        console.log('🔁 Get new projects');
        let projectsXML: Document = new dom().parseFromString(xmlDocu);
        let xpathDisplayName: string =
          '//cal:comp[@name="VTODO"]/../../d:displayname';
        let displaynames = xpath.select(xpathDisplayName, projectsXML);
        let xpathHref: string = '//cal:comp[@name="VTODO"]/../../../../d:href';
        let hrefs = xpath.select(xpathHref, projectsXML);
        let xpathDelete: string = '//cal:comp[@name="VTODO"]/../..';
        let fullRawXML = xpath.select(xpathDelete, projectsXML);

        let xPathCalendarDisplayName: string =
          '//cal:comp[@name="VEVENT"]/../../d:displayname';
        let displayNamesCalendar = xpath.select(
          xPathCalendarDisplayName,
          projectsXML
        );
        let xPathCalendarHref: string =
          '//cal:comp[@name="VEVENT"]/../../../../d:href';
        let displayNamesHref = xpath.select(xPathCalendarHref, projectsXML);

        this.projects = defaultProjects;
        for (let ctrProject = 0; ctrProject < 100; ctrProject++) {
          if (fullRawXML[ctrProject] != null) {
            let newProject = this.parserService.parseProjects(
              displaynames[ctrProject].firstChild.data,
              hrefs[ctrProject].firstChild.data
            );
            newProject.sorting = this.projects.length;
            let fullRawText: string = fullRawXML[ctrProject].toString();
            let isInProjects: boolean = false;
            if (this.projects.length > 0) {
              this.projects.forEach((project) => {
                if (newProject['url'] == project['url']) {
                  isInProjects = true;
                }
              });
            }

            if (
              !isInProjects &&
              !fullRawText.includes(
                '<x2:deleted-at xmlns:x2="http://nextcloud.com/ns">2'
              )
            ) {
              this.projects.push(newProject);
              this.projectTitles.push(displaynames[ctrProject].firstChild.data);
            }
          }
        }
        // Delete objects are delete on day in 20** century others have no date inside
        this.storage.set('projects', this.projects).then(() => {
          this.storage.set('projectTitles', this.projectTitles).then(() => {

            console.log('🔁 Projects updated');
            this.getTodos();

          });
        });

        for (let ctrCalendar = 0; ctrCalendar < 30; ctrCalendar++) {
          if (displayNamesCalendar[ctrCalendar] != undefined) {
            this.calendars.push({
              name: displayNamesCalendar[ctrCalendar].firstChild.data,
              url: displayNamesHref[ctrCalendar].firstChild.data,
            });
          }
        }
        this.calendars.forEach((calendar) => {
          calendar.url = calendar.url
            .replace('/remote.php/dav/calendars/' + nextcloudUser + '/', '')
            .replace('/', '');
        });

        this.storage.set('calendars', this.calendars);
      },
      error: (error) => {
        console.error('⭕ Cannot get projects', JSON.stringify(error));
        this.syncActive = false;
        if (error.status == 401 || error.status == 403) {
          this.syncStatus = 'not authorized';
        }
        if (error.status == 404) {
          this.messageService.show('Offline Mode');
          this.syncStatus = 'offline';
        }
      },
    });
  }

  getTodos(): void {
    this.newRelatedTodos = [];
    this.newTodos = [];
    this.relatedTodos = [];
    this.todos = [];
    let ctrResolved = 0;
    let resolveProjects: Project[] = [];
    for (
      let ctrProjects = 0;
      ctrProjects < this.projects.length;
      ctrProjects++
    ) {
      if (
        this.projects[ctrProjects].url != 'only-view' &&
        this.projects[ctrProjects].visible &&
        !this.projects[ctrProjects].title.includes('Upcomming')
      ) {
        resolveProjects.push(this.projects[ctrProjects]);
      }
    }
    resolveProjects.forEach((project) => {
      this.nextcloud.getTodosFormNextcloud(project.url).subscribe({
        next: (rawTodos: string) => {
          if (rawTodos != null || rawTodos.length > 10) {
            ctrResolved++;
            this.parseAllTodosInput(rawTodos, project);

            // 2 not visible and 2 only-view
            if (ctrResolved == resolveProjects.length) {
              this.finishSync();
            }
          }
        },
        error: (error) => {
          console.error(
            '⭕ Cannot get todo list' + project.url,
            JSON.stringify(error)
          );
          if (error.status == 401 || error.status == 403) {
            this.syncStatus = 'not authorized';
            this.syncActive = false;
          }
          if (error.status == 404) {
            this.syncActive = false;
            this.syncStatus = 'offline';
          }
        },
      });
    });
  }

  finishSync() {
    this.todos = this.newTodos;
    this.relatedTodos = this.newRelatedTodos;
    clearTimeout(this.superTimeout);
    console.log(
      '✅ Synced ' +
      this.todos.length
      +
      ' todos and ' +
      this.relatedTodos.length +
      ' subtodos in ' +
      (performance.now() - this.timeForSync) / 1000 +
      's'
    );
    this.todos.forEach((todo) => {
      this.relatedTodos.forEach((relatedTodo) => {
        if (relatedTodo.related == todo.uid) {
          todo.subs.push(relatedTodo);
        }
      });


    });
    this.storage.set('todos', this.todos).then(() => {
      this.storage.set('relatedTodos', this.relatedTodos).then(() => {
        // add unique tags
        this.storage.set('tags', this.tags.filter((value, index, array) => array.indexOf(value) === index)).then(() => {
          this.syncStatus = 'resolved';
          this.syncActive = false;
        });
      });
    });
  }

  parseAllTodosInput(xmlTodos: string, project: Project) {
    let parser: DOMParser = new DOMParser();

    let todoXML = parser.parseFromString(xmlTodos, 'text/xml');
    let icalHrefs = todoXML.getElementsByTagName('d:href');
    let todosIcalRaws = todoXML.getElementsByTagName('cal:calendar-data');

    let ctrTodosInList = 0;

    for (let ctrTodos = 0; ctrTodos < todosIcalRaws.length; ctrTodos++) {
      if (
        !todosIcalRaws[ctrTodos].firstChild.nodeValue.includes(
          'PERCENT-COMPLETE:100'
        )
      ) {
        let todo: Todo = this.parserService.parseIcalToTodo(
          icalHrefs[ctrTodos].firstChild.nodeValue,
          todosIcalRaws[ctrTodos].firstChild.nodeValue,
          project
        );
        console.log(this.tags)
        this.tags = this.tags.concat(todo.tags);

        if (todo.status != 'COMPLETED') {
          if (todo.icsid == 's20-dontdeleteprojects') {
            try {
              this.projects = JSON.parse(todo.description);
              this.storage.set('projects', this.projects);
            } catch (error) {
              this.messageService.show('⭕ Cannot parse projects', true);
            }
          } else {
            ctrTodosInList++;
            if (todo.related != '') {
              this.newRelatedTodos.push(todo);
            } else {
              this.newTodos.push(todo);
            }
          }
        }
      }
    }
    project.count = ctrTodosInList;
    console.log(
      'Refresh: ' + project.title + ' with ' + ctrTodosInList + ' todos'
    );
  }

  async addToQueue(queueItem: QueueItem) {
    this.queue.push(queueItem);
    this.storage.set('queue', this.queue);
    this.queueLength++;
    this.messageService.show('💾 Save Request - offline', true);
  }

  initateLogin(credentials) {
    this.isLoginOpen = false;

  }

  async presentRegisterPrompt() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Register',
      message:
        'You need to allow cookies. The Nextcloud-URL have the format https://[host]/remote.php/dav/calendars/[user]/. The Nextcloud API-Key is available in "Administration Settings > Security > Create new app password."',
      inputs: [
        {
          name: 'username',
          type: 'text',
          min: 3,
          max: 20,
          placeholder: 's20 Username',
        },
        {
          name: 'email',
          type: 'email',
          min: 5,
          max: 100,
          placeholder: 'E-Mail',
        },
        {
          name: 'password',
          min: 12,
          max: 200,
          type: 'password',
          placeholder: 'Password (12+ chars)',
        },
        {
          name: 'nextcloudurl',
          type: 'url',
          min: 10,
          max: 400,
          placeholder: 'Nextcloud-URL',
        },
        {
          name: 'nextcloudkey',
          type: 'text',
          min: 10,
          max: 100,
          placeholder: 'Nextcloud API-Key',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Submit',
          handler: (credentials) => {
            this.isLoginOpen = false;

          },
        },
      ],
    });
    await alert.present();
  }
}
