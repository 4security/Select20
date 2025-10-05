import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { ExplainPage } from './explain/explain.page';

export const routes: Routes = [

  {
    path: '', component: HomePage
  },
  {
    path: 'explain', component: ExplainPage
  }
];
