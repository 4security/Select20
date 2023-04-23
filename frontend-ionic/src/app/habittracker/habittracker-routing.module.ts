import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabittrackerPage } from './habittracker.page';

const routes: Routes = [
  {
    path: '',
    component: HabittrackerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabittrackerPageRoutingModule {}
