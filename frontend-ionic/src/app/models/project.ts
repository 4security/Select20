import { defaultCalendar } from "../config";
import { Calendar } from "./calendar";

export class Project {
    title: string = "";
    url: string = "";
    calendar: Calendar = defaultCalendar
    colour: string = "";
    position: number = 0;
    sorting: number = 0;
    status: string = "normal";
    count: number = 0;
}