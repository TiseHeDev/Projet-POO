// src/app/app-module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// Ces deux lignes résolvent [formGroup], [ngValue] et les erreurs de liaison de formulaire
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
// 👈 CET IMPORT EST CRUCIAL pour *ngIf, *ngFor, et les pipes standards (currency)
import { CommonModule } from '@angular/common'; 

// Import des composants (assurez-vous que les noms des fichiers correspondent aux noms des classes !)
import { AppComponent } from './app.component'; 
import { DashboardComponent } from './dashboard/dashboard.component';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent, 
    TransactionFormComponent 
  ],
  imports: [
    BrowserModule,
    CommonModule,        // 👈 AJOUTÉ ICI
    FormsModule,         
    ReactiveFormsModule  // 👈 AJOUTÉ ICI
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }