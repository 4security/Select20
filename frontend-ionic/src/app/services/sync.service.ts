import { Injectable } from '@angular/core';
import { MessageService } from './message.service';
import { NextcloudService } from './nextcloud.service';
import { ParserService } from './parser.service';
//import { DOMParserImpl as dom } from 'xmldom-ts';
//import * as xpath from 'xpath-ts';
import { Project } from '../models/project';
import { Calendar } from '../models/calendar';
import { defaultProjects, nextcloudUser } from '../config';
import { Todo } from '../models/todo';
import { Storage } from '@ionic/storage-angular';
import { QueueItem } from '../models/queueItem';
import { AlertController } from '@ionic/angular/standalone';
import { XMLParser } from 'fast-xml-parser';

@Injectable({
  providedIn: 'root',
})
export class SyncService {

  todos: Todo[] = [];
  tags: String[] = [];
  relatedTodos: Todo[] = [];
  newTodos: Todo[] = [];
  newRelatedTodos: Todo[] = [];
  timeForSync: number = 0;
  queue: QueueItem[] = [];
  projects: Project[] = defaultProjects;
  projectTitles: string[] = [];
  queueLength: number = 0;
  calendars: Calendar[] = [];
  syncActive = false;
  syncStatus: string = 'initial';
  isLoginOpen: boolean = false;
  superTimeout: any;
  _storage: Storage | null = null;

  constructor(
    private nextcloud: NextcloudService,
    private parserService: ParserService,
    private alertController: AlertController,
    private storage: Storage,
    private messageService: MessageService
  ) { }

  async ngOnInit() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  noInternet(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.onLine) {
        resolve(true);
        return;
      }

      // Try to fetch a lightweight resource
      fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' })
        .then(() => resolve(false)) // Online
        .catch(() => resolve(true)); // Offline or no internet access
    });
  }

  startSync() {
    this.noInternet().then((offline: any) => {
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
          this.projects = defaultProjects;
          this.getProjectsAddNewOnes();
          this.startOfflineSync();
          this.startTimeout();


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

  updateSettings() {
    this.storage.get('projects').then((projects: Project[]) => {
      this.storage.get('tags').then((tags: String[]) => {
        this.storage.get('calendars').then((calendars: string[]) => {
          this.storage.get('currentProject').then((currentProject: Project) => {
            var projectTitles: string[] = [];
            projects.forEach(project => {
              projectTitles.push(project.title);
            });

            if (currentProject == null) {
              currentProject == defaultProjects[0];
            }
            var settings = {
              "projectTitles": projectTitles,
              "projects": projects,
              "tags": tags,
              "calendars": calendars,
              "currentProject": currentProject
            }

            this.nextcloud.updateSettings({ "settings": JSON.stringify(settings) }).subscribe({
              next: (result: any) => {
                console.log("Sync settings");
              }
            });
          });
        });
      });
    });
  }

  getSettings() {
    this.nextcloud.getSettings().subscribe({
      next: (settings: any) => {
        this.parseSettings(JSON.parse(settings.settings));
      },
      error: (error: any) => {
        this.messageService.show('Error Get Settings', true);
        console.error(
          '⭕ Error loading settings', error
        );
      },
    });
  }

  parseSettings(settings: any) {
    try {
      this.storage.set("projectTitles", settings["projectTitles"]);
      this.storage.set("projects", settings["projects"]);
      this.storage.set("tags", settings["tags"]);
      this.storage.set("calendars", settings["calendars"]);
      this.storage.set("currentProject", settings["currentProject"]);
    } catch (error) {
      console.log("Cannot parse settings");

    }

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
                  this.queue.splice(queueIndex, 1);
                  this.storage.set('queue', this.queue);
                }
                this.messageService.show('💾 Sync Offline Todo');
                this.queueLength = this.queue.length;
              },
              error: (error: any) => {
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
        console.log('🔁 Get fresh projects');
        const parser = new XMLParser({
          ignoreAttributes: false,
        });
        let xmlProject = parser.parse(xmlDocu);
        let responses = xmlProject["d:multistatus"]["d:response"];
        let displayNames: string[] = responses.map((res: any) => {
          return res["d:propstat"][0]["d:prop"]["d:displayname"];
        });
        let href: string[] = responses.map((res: any) => {
          return res["d:href"];
        });
        let types: string[] = responses.map((res: any) => {
          var result = "VEVENT";
          try {
            result = res["d:propstat"][0]["d:prop"]["cal:supported-calendar-component-set"]["cal:comp"]['@_name'];
          } catch (error) { }
          return result
        });
        let deletedAt: string[] = responses.map((res: any) => {
          return res["d:propstat"][0]["d:prop"]["x2:deleted-at"];
        });
        console.log(deletedAt);


        let calendars: any = [];
        // Add new project if not already in project list
        for (let ctrProjects = 0; ctrProjects < displayNames.length; ctrProjects++) {

          let isInProjects: boolean = false;
          let newProject = this.parserService.parseProjects(
            displayNames[ctrProjects],
            href[ctrProjects],
            deletedAt[ctrProjects]
          );
          this.projects.forEach((project) => {
            if (newProject['url'] == project['url']) {
              isInProjects = true;
            }
          });
          if (displayNames[ctrProjects] !== undefined && displayNames[ctrProjects] != "" && !displayNames.includes("remote") && !href[ctrProjects].includes("outlook")) {
            if (!isInProjects && types[ctrProjects] != "VEVENT") {
              this.projects.push(newProject);

            }
            if (types[ctrProjects] == "VEVENT") {
              calendars.push({
                name: displayNames[ctrProjects],
                url: href[ctrProjects],
              })
            }
          }
        }
        this.storage.set('calendars', calendars).then(() => {
          this.storage.set('projects', this.projects).then(() => {
            this.projects.forEach(project => {
              this.projectTitles.push(project.title);
            });
            this.storage.set('projectTitles', this.projectTitles).then(() => {
              console.log('🔁 Calendars & Projects updated');
              this.updateSettings();
              this.getTodos();
            });
          });
        });
      },
      error: (error: any) => {
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
        !this.projects[ctrProjects].title.includes('Upcomming')
      ) {
        resolveProjects.push(this.projects[ctrProjects]);
      }
    }
    resolveProjects.forEach((project) => {
      this.nextcloud.getTodosFormNextcloud(project.url).subscribe({
        next: (rawTodos: any) => {
          if (rawTodos != null || rawTodos.length > 10) {
            ctrResolved++;
            this.parseAllTodosInput(rawTodos, project);

            // 2 not visible and 2 only-view
            if (ctrResolved == resolveProjects.length) {
              this.finishSync();
            }
          }
        },
        error: (error: any) => {
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
        !todosIcalRaws[ctrTodos].firstChild?.nodeValue?.includes(
          'PERCENT-COMPLETE:100'
        )
      ) {
        let todo: Todo = this.parserService.parseIcalToTodo(
          icalHrefs[ctrTodos].firstChild?.nodeValue ?? '',
          todosIcalRaws[ctrTodos].firstChild?.nodeValue ?? '',
          project
        );
        this.tags = this.tags.concat(todo.tags);

        if (todo.status != 'COMPLETED') {

          ctrTodosInList++;
          if (todo.related != '') {
            this.newRelatedTodos.push(todo);
          } else {
            this.newTodos.push(todo);
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

  initateLogin(credentials: any) {
    this.isLoginOpen = false;
  }

  async presentRegisterPrompt() {
    const alert = await this.alertController.create({
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
