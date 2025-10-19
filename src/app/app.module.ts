import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { LanguageSwitcherComponent } from './shared/language-switcher/language-switcher.component';

import { ModalComponent } from './shared/modal/modal.component';
import { ModalContainerComponent } from './shared/modal-container/modal-container.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EmployeeListComponent,
    AdminDashboardComponent,
    LanguageSwitcherComponent,
    ModalComponent,
    ModalContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }