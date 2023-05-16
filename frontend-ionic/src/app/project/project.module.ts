import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ProjectPageRoutingModule } from './project-routing.module';

import { ProjectPage } from './project.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProjectPageRoutingModule
  ],
  declarations: [ProjectPage]
})
export class ProjectPageModule { }
