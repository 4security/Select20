import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'project',
    loadChildren: () => import('./project/project.module').then( m => m.ProjectPageModule)
  },
  {
    path: 'habittracker',
    loadChildren: () => import('./habittracker/habittracker.module').then( m => m.HabittrackerPageModule)
  },
  {
    path: 'explain',
    loadChildren: () => import('./explain/explain.module').then( m => m.ExplainPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
