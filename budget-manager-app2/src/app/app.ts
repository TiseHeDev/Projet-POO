// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionForm } from './components/transaction-form/transaction-form';
import { Dashboard } from './components/dashboard/dashboard';
import { Transaction } from './models/transaction.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TransactionForm, Dashboard], 
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Gestionnaire de Budget';
  
  transactionToEdit: Transaction | null = null;
  
  onEditRequest(transaction: Transaction): void {
    this.transactionToEdit = transaction;
  }
  
  clearEditState(): void {
    this.transactionToEdit = null;
  }
}