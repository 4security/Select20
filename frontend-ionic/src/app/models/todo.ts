import { Project } from "./project";

export class Todo {
  uid: string;
  icsID: string;
  title: string;
  priority: number;
  description: string;
  created: string;
  modified: string;
  startDate: string;
  due: string;
  dueUNIX: number;
  createdUNIX: number;
  categories: string;
  status: string;
  rrule: string;
  percent: number;
  duration: number;
  endDate: string;
  raw: string;
  related: string;
  project: Project;
  isVisible: boolean;
  isChecklist: boolean;
  isOverdue: boolean;
  subs: Todo[];
  tags: string[]
}
