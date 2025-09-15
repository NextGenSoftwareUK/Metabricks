import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HallOfFameComponent } from './hall-of-fame.component';

@NgModule({
  declarations: [
    HallOfFameComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class HallOfFameModule { }
