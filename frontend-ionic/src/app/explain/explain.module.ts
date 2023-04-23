import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ExplainPageRoutingModule } from './explain-routing.module';

import { ExplainPage } from './explain.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExplainPageRoutingModule
  ],
  declarations: [ExplainPage]
})
export class ExplainPageModule {}
