# Select20 - The Intelligent Privacy Todolist

> The todo app Select20 leverages language recognition to manage tasks more efficently. The distraction-free and blazing fast app supports offline usage and compatibility to CalDav.

<img src="images/inbox.png" alt="drawing"/>

## Test it now!

1. Clone the git repo

```sh
git clone ...
```

2. Change the passwords in the backend-laravel/.env.example --> .env file
3. Spin up docker

```sh
docker compose up
```

4. Open new console & initialize database only on the first startup

```sh
docker exec select20_backend_laravel sh -c  "php artisan migrate && php artisan jwt:secret -f && php artisan key:generate"
```
5. Restart docker compose --> `Strg + c` and `docker compose up` again

6. Open http://localhost:8081

Quick Links: Developer Docu - Contributing - Code of Conduct

## Why should I use Select20?

### Detects your natural language (NLP)

<img src="images/mobile.png" align="right" alt="drawing" width="200"/>

- weekday (mon, tue, ...)
- time (12:12)
- date (12.12.12 or half dates 12.12)
- priority (p1, p2, p3, p4) with colors
- recurring rule
  - simple (every day, every sun)
  - with (every 6 mon)
  - display next event
  - combined with time (every tue 17:00)
- project - fuzzy search (#wor --> assigns project work)
- duration (120m)
- checklists (\* my checklist)
- due date calendar suppress (!nocal)

### Support for hyper dynamic todos

<img src="images/subtasks.png" alt="drawing"/>

- autofocus creation of todos
- key data chips
  - time
  - overdue
  - checklist
  - duration
  - project
- tasks with subtasks
- auto HTML strip
- auto detection of URL
  - detects the first URL
  - add a url button (new tab)
- delete recurring rule / end to do forever
- auto create calendar entry
  - when due date is set
  - connect calendars with todolists
- create todos in other projects
  - with #projectname
  - temp display in current project

### Plan projects like PRO

<img src="images/projects.png" align="right" alt="drawing" width="200"/>

- default project: today / Upcoming / Inbox
- indentation for sub projects
- sorting
- connect callendar with todo

- todo will not crate a calendar entry if ...
  - **!nocal** expression
  - day tasks (no time)
  - no due set
  - todos with a reccurring rule
- project settings synced over devices

### Security first features!

- Selfhosted - no online access needed
- Never delete a todo
- Force TLS (HTTPs) with PWA
- CSRF protection
- XSS protection
- SQL-Injection protection
- No nextcloud keys in frontend

### Fallout shelter proof syncing

<img src="images/fast.png" alt="drawing" width="250"/>

- extreme caching
  - instant loading
  - update on view
  - cross device sync
- Progressive Web App
  - secure by default
  - service worker
  - installable
- Offline Support
  - toggling, editing and adding todos
  - Counter for pending changes
- Login / Register (muliple instances)

## Usage

- Start to type and use the keywords #, p1, dates, rythms
- Shift todos between project by typing #projectname at the end. The todo will shifted visually on the next project change / reload
- Undo finishing todos by using the Undo-button at top right (next to reload)
- Change the connected calendar per project by using the edit button
- Add links to you todo and hover the todo to get a direct link symbol

### Roadmap

- Android Sharing
- PWA Sharing
- Grouping by date
- Attributes
- Create and rename projects
- iOS App - you can release with Ionic easily a Ionic iOS App

Not-to-do - Simplify it:

- Sub-sub-todos
- dropdowns and lot of buttons
- Datepicker

## Why did I code the X millionst todo app?

The best todo app I tested was Todoist ... but I cannot self host the service and need to expose my private information for American agencies (aka 2Cloud"). So I started to code my own with Nextcloud in the background

## Licence

GNU GENERAL PUBLIC LICENSE Version 2
