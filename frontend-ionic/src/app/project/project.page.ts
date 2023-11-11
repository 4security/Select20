import { Component, OnInit } from '@angular/core';
import { Project } from '../models/project';
import { MessageService } from '../services/message.service';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { Calendar } from '../models/calendar';
import { RegexService } from '../services/regex.service';
import { Todo } from '../models/todo';
import { NextcloudService } from '../services/nextcloud.service';
import { ParserService } from '../services/parser.service';
import { defaultProjects } from '../config';
import { defaultCalendar } from '../config';

@Component({
  selector: 'app-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
})
export class ProjectPage {

  project: Project = defaultProjects[0];

  _storage: Storage | null = null;

  title: string = 'Project';
  sorting: number = 1;
  visible: boolean = true;
  position: boolean = false;
  calendar: Calendar = defaultCalendar;

  calendars: Calendar[];
  projects: Project[];

  isANewProject: boolean = false;

  constructor(
    private storage: Storage,
    public router: Router,
    private messageService: MessageService,
    private parserService: ParserService,
    private nextcloudService: NextcloudService,
    private regexService: RegexService
  ) {
    this.project.calendar = defaultCalendar;
  }

  async ionViewWillEnter() {
    this.isANewProject = false;
    const storage = await this.storage.create();
    this._storage = storage;
    this._storage.get('calendars').then((calendars: Calendar[]) => {
      this._storage.get('currentProject').then((project: any) => {
        this.storage.get('projects').then((syncedProjects: Project[]) => {
          this.calendars = calendars;
          this.projects = syncedProjects;
          if (project != "") {
            this.project = project;

            this.title = project.title;
            this.visible = project.visible;
            if (project.calendar != null) {
              this.calendar = project.calendar;
            } else {
              this.calendar = defaultCalendar;
            }

            this.sorting = project.sorting;
            if (project.position == 0) {
              this.position = false;
            } else {
              this.position = true;
            }
          } else {
            this.isANewProject = true;
          }
        });
      });
    });
  }

  saveProject(isDeleted: boolean = false) {
    let objIndex: number = this.readFromForm();
    let now = this.regexService.formatIcsDate(Date.now());
    let projectsPersist: Todo = {
      icsID: 's20-doNotDeleteThis',
      uid: 's20-doNotDeleteThis',
      title: 'default',
      priority: 4,
      description: JSON.stringify(this.projects),
      created: now,
      modified: now,
      startDate: now,
      due: '',
      dueUNIX: 0,
      createdUNIX: 0,
      categories: '',
      status: 'NEEDS-ACTION',
      raw: '',
      rrule: '',
      duration: 30,
      percent: 0,
      related: '',
      endDate: '',
      project: defaultProjects[0],
      isVisible: true,
      isChecklist: false,
      isOverdue: false,
      tags: [],
      subs: [],
    };

    if (isDeleted) {
      this.deleteProject(objIndex, projectsPersist);
    } else {
      if (this.isANewProject) {
        this.createProject(objIndex, projectsPersist);
      } else {
        this.saveProjectsInInboxTodo(projectsPersist);
      }
    }
  }

  handleChange(e) {
    this.calendar = e.detail.value;
  }

  private deleteProject(objIndex: number, projectsPersist: Todo) {
    this.nextcloudService.deleteProjects(this.projects[objIndex].url).subscribe({
      next: (deleteAnswer: string) => {
        this.messageService.show('💾 Project deleted');
        this.saveProjectsInInboxTodo(projectsPersist);
        var audio = new Audio('assets/audio/confirm.mp3');
        audio.play();
      },
      error: (error) => {
        this.messageService.show('⭕ Project cannot be deleted saved');
        console.error("⭕ Project cannot be deleted saved", error);
      },
    });
    this.projects = this.projects.splice(objIndex + 1);
  }

  readFromForm() {
    let objIndex: number = 0;
    if (!this.isANewProject) {
      objIndex = this.projects.findIndex(
        (ctrProject) => ctrProject.url == this.project.url
      );
    } else {
      objIndex = this.projects.length;
      this.projects[objIndex] = this.project;
      this.projects[objIndex].url = this.title.replace(/[^a-zA-Z]/g, '').toLocaleLowerCase();
    }

    this.projects[objIndex].sorting = this.sorting;
    if (this.position) {
      this.projects[objIndex].position = 1;
    } else {
      this.projects[objIndex].position = 0;
    }
    if (this.visible) {
      this.projects[objIndex].visible = true;
    } else {
      this.projects[objIndex].visible = false;
    }

    if (this.calendar != null) {
      this.projects[objIndex].calendar = this.calendar;
    } else {
      this.projects[objIndex].calendar = defaultCalendar;
    }
    this.projects[objIndex].title = this.title;
    return objIndex;
  }

  createProject(objIndex: number, projectsPersist: Todo) {
    this.nextcloudService.createProject(this.projects[objIndex].url).subscribe({
      next: (data) => {
        this.messageService.show('💾 New Project saved');
        this.saveProjectsInInboxTodo(projectsPersist);
        var audio = new Audio('assets/audio/confirm.mp3');
        audio.play();
      },
      error: (error) => {
        this.messageService.show('⭕ New Project not saved');
        console.error("⭕ New Project not saved", error);
      },
    });
  }

  saveProjectsInInboxTodo(projectsPersist) {
    this.projects.sort((a, b) => a.sorting - b.sorting);
    this.nextcloudService
      .pushTodo(
        defaultProjects[0],
        projectsPersist,
        this.parserService.createProjectPersist(this.projects),
        false
      )
      .subscribe({
        next: (answerProjectSaved: string) => {
          if (answerProjectSaved == "") {
            this.messageService.show('💾 Project saved');
            this._storage.set('projects', this.projects).then((projects: Project[]) => {
              this.router.navigate(['home'], {
                state: { projects: this.projects },
              });
            });
            var audio = new Audio('assets/audio/confirm.mp3');
            audio.play();
          } else {
            this.messageService.show('⭕ Sabre Error Project not saved');
            console.error("⭕ Sabre Error Project not saved", answerProjectSaved);
          }
        },
        error: (error) => {
          this.messageService.show('⭕ Project not saved');
          console.error("⭕ Project not saved", error);
        },
      });
  }

  removeProject() {
    this.saveProject(true)
  }
}
