import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Project } from '../models/project';
import { Todo } from '../models/todo';
import { Calendar } from '../models/calendar';
import { proxyDomain } from '../config';

@Injectable({
  providedIn: 'root',
})
export class NextcloudService {
  constructor(public http: HttpClient) { }

  getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  pushTodo(project: Project, todo: Todo, rawTodo: string, isDeleted: boolean) {
    let saveCalendar: Calendar = project.calendar;

    if (
      saveCalendar == null ||
      saveCalendar.url == '' ||
      isDeleted ||
      todo.rrule != '' ||
      todo.due == null ||
      todo.due.includes('000000') ||
      todo.due == ''
    ) {
      saveCalendar = {
        name: 'none',
        url: 'none',
      };
    }
    console.log('✅ Save Todo:', todo.title, ' in calendar ', saveCalendar);

    if (project.url.replace('/', '') == 'only-view') {
      project.url = 'inbox-1';
    }

    return this.http.post(
      proxyDomain + '/auth/todo',
      JSON.stringify({
        list: project.url,
        ics: todo.icsid,
        calendar: saveCalendar.url,
        ical: rawTodo,
      }),
      {
        headers: this.getHeaders(),
        responseType: 'text',
        withCredentials: true,
      }
    );
  }

  login(email: string, password: string) {
    return this.http.post(
      proxyDomain + '/auth/login',
      JSON.stringify({ email: email, password: password }),
      {
        headers: this.getHeaders(),
        withCredentials: true,
      }
    );
  }

  register(
    username: string,
    email: string,
    password: string,
    nextcloudurl: string,
    nextcloudkey: string
  ) {
    return this.http.post(
      proxyDomain + '/auth/register',
      JSON.stringify({
        name: username,
        email: email,
        password: password,
        nextcloudurl: nextcloudurl,
        nextcloudkey: nextcloudkey,
      }),
      {
        headers: this.getHeaders(),
        withCredentials: true,
      }
    );
  }

  getProjects() {
    return this.http.get(proxyDomain + '/auth/project', {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true,
    });
  }

  createProject(name: string) {
    return this.http.put(proxyDomain + '/auth/project', JSON.stringify({
      name: name
    }), {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true,
    });
  }

  deleteProjects(id: string) {
    return this.http.delete(proxyDomain + '/auth/project/' + id, {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true,
    });
  }

  getTodosFormNextcloud(projecturl: string) {
    return this.http.post(
      proxyDomain + '/auth/proxytodo',
      JSON.stringify({ list: projecturl.replace('/', '') }),
      {
        headers: this.getHeaders(),
        responseType: 'text',
        withCredentials: true,
      }
    );
  }

  getHabitMatrix() {
    return this.http.get(proxyDomain + '/auth/habits', {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true,
    });
  }

  logout() {
    return this.http.post(proxyDomain + '/auth/logout', '', {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true,
    });
  }
}
