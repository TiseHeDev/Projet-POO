// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionForm } from './components/transaction-form/transaction-form';
import { Dashboard } from './components/dashboard/dashboard';
import { CategoryManager } from './components/category-manager/category-manager'; 
import { Transaction } from './models/transaction.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TransactionForm, Dashboard, CategoryManager], 
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Gestionnaire de Budget';
  
  transactionToEdit: Transaction | null = null;
  isModalOpen: boolean = false; // Modale de Transaction
  isCategoryModalOpen: boolean = false; // NOUVEAU: Modale de Catégories
  
  // Logique de Modale de Transaction (inchangée)
  onEditRequest(transaction: Transaction): void {
    this.transactionToEdit = transaction;
    this.isModalOpen = true; 
  }
  
  clearEditState(): void {
    this.transactionToEdit = null;
    this.isModalOpen = false;
  }
  
  onAddRequest(): void { 
      this.transactionToEdit = null; 
      this.isModalOpen = true;
  }
  
  // NOUVEAU: Logique de Modale de Catégories
  openCategoryModal(): void {
      this.isCategoryModalOpen = true;
  }
  
  closeCategoryModal(): void {
      this.isCategoryModalOpen = false;
  }
}