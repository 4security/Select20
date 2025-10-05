import { defaultProjects } from "../config";
import { Project } from "./project";

export class Todo {
  uid: string = "";
  icsID: string = "";
  title: string = "";
  priority: number = 0;
  description: string = "";
  created: string = "";
  modified: string = "";
  startDate: string = "";
  due: string = "";
  dueUNIX: number = 0;
  createdUNIX: number = 0;
  categories: string = "";
  status: string = "";
  rrule: string = "";
  percent: number = 0;
  duration: number = 0;
  endDate: string = "";
  raw: string = "";
  related: string = "";
  project: Project = defaultProjects[0];
  isVisible: boolean = true;
  isChecklist: boolean = false;
  isOverdue: boolean = false;
  subs: Todo[] = [];
  tags: string[] = [];
}
