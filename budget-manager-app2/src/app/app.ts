// src/app/app.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionForm } from './components/transaction-form/transaction-form';
import { Dashboard } from './components/dashboard/dashboard';
import { CategoryManager } from './components/category-manager/category-manager';
import { LabelManager } from './components/label-manager/label-manager';  // NOUVEAU
import { Transaction } from './models/transaction.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    TransactionForm, 
    Dashboard, 
    CategoryManager,
    LabelManager  // NOUVEAU
  ], 
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'Gestionnaire de Budget';
  
  transactionToEdit: Transaction | null = null;
  isModalOpen: boolean = false;
  isCategoryModalOpen: boolean = false;
  isLabelModalOpen: boolean = false;  // NOUVEAU
  
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
  
  openCategoryModal(): void {
      this.isCategoryModalOpen = true;
  }
  
  closeCategoryModal(): void {
      this.isCategoryModalOpen = false;
  }

  // NOUVEAU: Gestion modale labels
  openLabelModal(): void {
      this.isLabelModalOpen = true;
  }
  
  closeLabelModal(): void {
      this.isLabelModalOpen = false;
  }
}