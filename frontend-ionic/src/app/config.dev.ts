import { Calendar } from "./models/calendar";
import { Project } from "./models/project";

const proxyDomain = "http://192.168.178.99:8001/api";
const defaultCalendar: Calendar = {
    name: "tasks",
    url: "tasks"
};
const nextcloudUser = "steffen";
const defaultProjects: Project[] = [
    {
        title: '📥 Inbox',
        url: 'inbox-1/',
        colour: '',
        intendation: 0,
        calendar: defaultCalendar,
        sorting: 1,
        visible: true,
        count: 0,
    },
    {
        title: '🔴 Today',
        url: 'only-view',
        colour: '',
        intendation: 0,
        calendar: defaultCalendar,
        sorting: 2,
        visible: true,
        count: 0,
    },
    {
        title: '📅 Upcomming',
        url: 'only-view',
        colour: '',
        intendation: 0,
        calendar: defaultCalendar,
        sorting: 3,
        visible: true,
        count: 0
    }
];
const defaultCurrentProject: Project = {
    title: '🔴 Today',
    url: 'only-view',
    colour: '',
    intendation: 0,
    calendar: defaultCalendar,
    sorting: 2,
    visible: true,
    count: 0,
};

export { defaultProjects, defaultCalendar, defaultCurrentProject, proxyDomain, nextcloudUser };
