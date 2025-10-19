import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list.component';

const routes: Routes = [
  { path: '', component: EmployeeListComponent }
];

@NgModule({
  declarations: [EmployeeListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class EmployeeListModule { }