import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HabittrackerPageRoutingModule } from './habittracker-routing.module';

import { HabittrackerPage } from './habittracker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HabittrackerPageRoutingModule
  ],
  declarations: [HabittrackerPage]
})
export class HabittrackerPageModule {}
