import { Project } from "./project";

export class Todo {
  uid: string;
  icsid: string;
  title: string;
  priority: number;
  description: string;
  created: string;
  modified: string;
  startdate: string;
  due: string;
  dueUNIX: number;
  createdUNIX: number;
  categories: string;
  status: string;
  rrule: string;
  precent: number;
  duration: number;
  enddate: string;
  raw: string;
  related: string;
  project: Project;
  isVisible: boolean;
  isChecklist: boolean;
  isOverdue: boolean;
  subs: Todo[];
}
