import { Component, OnInit } from '@angular/core';
import { eachDayOfInterval, format, isSameDay, parse } from 'date-fns';
import { NextcloudService } from '../services/nextcloud.service';

@Component({
  selector: 'app-habittracker',
  templateUrl: './habittracker.page.html',
  styleUrls: ['./habittracker.page.scss'],
})
export class HabittrackerPage implements OnInit {
  habits: any[] = [];
  constructor(private nextcloud: NextcloudService) {}

  ngOnInit() {
    this.nextcloud.getHabitMatrix().subscribe({
      next: (result:any) => {
        let finishedHabits = JSON.parse(result);
        finishedHabits.forEach((habit) => {
          habit.prio = parseInt(habit.prio);
        });
        finishedHabits.sort((a, b) => (a.prio > b.prio ? 1 : -1));

        for (let checkHabit of finishedHabits) {
          let isAdded = false;
          for (let habit of this.habits) {
            if (habit['uid'] == checkHabit['uid']) {
              isAdded = true;
              habit['dates'].push({
                date: parse(checkHabit['date'], 'yyyy-MM-dd', new Date()),
                weekday: format(
                  parse(checkHabit['date'], 'yyyy-MM-dd', new Date()),
                  'dd'
                ),
                status: 'done',
              });
            }
          }
          if (!isAdded) {
            this.habits.push({
              uid: checkHabit['uid'],
              summary: checkHabit['summary'],
              prio: checkHabit['prio'],
              dates: [
                {
                  date: parse(checkHabit['date'], 'yyyy-MM-dd', new Date()),
                  weekday: format(
                    parse(checkHabit['date'], 'yyyy-MM-dd', new Date()),
                    'dd'
                  ),
                  status: 'done',
                },
              ],
            });
          }
        }

        this.habits = this.habits.filter((habit) => !(habit.dates.length < 3));
        this.habits.forEach((habit) => {
          if (habit.dates.length > 2) {
            let allDates = eachDayOfInterval({
              start: habit.dates[0].date,
              end: Date.now(),
            });

            allDates.forEach((normalDay) => {
              let needToFill = true;
              habit.dates.forEach((doneDay) => {
                if (isSameDay(doneDay.date, normalDay)) {
                  needToFill = false;
                }
              });
              if (needToFill) {
                habit.dates.push({
                  date: normalDay,
                  weekday: format(normalDay, 'dd'),
                  status: 'nope',
                });
              }
            });
            habit.dates = habit.dates.sort((a, b) =>
              a.date > b.date ? 1 : -1
            );
            habit.dates = habit.dates.slice(
              habit.dates.length - 31,
              habit.dates.length - 1
            );
          }
        });
      },
    });
  }
}
