import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';

export const routes: Routes = [

  {
    path: 'style-guide',
    component: StyleGuideComponent
  },
  {
    path:'login',
    component: LoginComponent
  },

];
