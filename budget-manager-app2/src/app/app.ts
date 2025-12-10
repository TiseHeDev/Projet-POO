// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionForm } from './components/transaction-form/transaction-form';
import { Dashboard } from './components/dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  // Importation des composants pour pouvoir les utiliser dans app.html
  imports: [CommonModule, TransactionForm, Dashboard], 
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Gestionnaire de Budget';
}