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
  isModalOpen: boolean = false; 
  
  onEditRequest(transaction: Transaction): void {
    this.transactionToEdit = transaction;
    this.isModalOpen = true; // Ouvre la modale en mode édition
  }
  
  clearEditState(): void {
    this.transactionToEdit = null;
    this.isModalOpen = false;
  }
  
  // NOUVEAU/MODIFIÉ: Gère l'ouverture de la modale (Ajout ou Édition)
  onAddRequest(): void { 
      this.transactionToEdit = null; // Assure le mode Ajout
      this.isModalOpen = true;
  }
}