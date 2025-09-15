import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from '../landing/landing.component';
import { HomeComponent } from './home.component';
import { GalleryComponent } from '../gallery/gallery.component';
import { HallOfFameComponent } from '../hall-of-fame/hall-of-fame.component';
import { SiteConfigComponent } from '../admin/site-config/site-config.component';
import { BackendTestComponent } from '../backend-test/backend-test.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: '',
        component: LandingComponent
      },
      {
        path: 'gallery',
        component: GalleryComponent
      },
      {
        path: 'hall-of-fame',
        component: HallOfFameComponent
      },
      {
        path: 'admin/site-config',
        component: SiteConfigComponent
      },
      {
        path: 'backend-test',
        component: BackendTestComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
