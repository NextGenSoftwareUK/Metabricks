import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PumpFunTestComponent } from './pump-fun-test.component';
import { PumpFunService } from '../../services/pump-fun.service';

@NgModule({
  declarations: [
    PumpFunTestComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  providers: [PumpFunService]
})
export class PumpFunTestModule { }
