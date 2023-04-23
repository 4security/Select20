import { Project } from "./project";
import { Todo } from "./todo";

export class QueueItem {
    project: Project;
    todo: Todo;
    raw: string;
}