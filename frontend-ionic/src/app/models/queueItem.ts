import { defaultProjects } from "../config";
import { Project } from "./project";
import { Todo } from "./todo";

export class QueueItem {
    project: Project = defaultProjects[0];
    todo: Todo = {
        icsID: "xxxxxxxxxxxxxxxxxxx",
        uid: "xxxxxxxxxxxxxxxxxxxxx",
        title: 'default',
        priority: 4,
        description: '',
        created: "",
        modified: "",
        startDate: "",
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
    raw: string = "";
}