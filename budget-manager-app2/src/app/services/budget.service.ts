// src/app/services/budget.service.ts

import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { BehaviorSubject, Observable } from 'rxjs';

const DEFAULT_CATEGORIES: string[] = [
    'Loyer', 'Nourriture', 'Transport', 'Loisirs', 'Santé', 'Salaire', 'Divers'
];

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private transactionsSubject: BehaviorSubject<Transaction[]>;
  public transactions$: Observable<Transaction[]>;

  private categoriesSubject: BehaviorSubject<string[]>; 
  public categories$: Observable<string[]>;            

  constructor() {
    // Les données démarrent à vide, prêtes pour l'importation JSON
    this.transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    this.transactions$ = this.transactionsSubject.asObservable();
    
    // Initialisation des catégories de base
    this.categoriesSubject = new BehaviorSubject<string[]>(DEFAULT_CATEGORIES);
    this.categories$ = this.categoriesSubject.asObservable();
  }

  // Logique interne de mise à jour (remplace save/load du localStorage)
  private updateTransactions(transactions: Transaction[]): void {
    this.transactionsSubject.next(transactions);
  }
  
  private updateCategories(categories: string[]): void {
      this.categoriesSubject.next(categories.sort()); 
  }

  // Logique de gestion des catégories
  addCategory(categoryName: string): void {
      const currentCategories = this.categoriesSubject.getValue();
      const standardizedName = categoryName.trim();
      
      if (currentCategories.some(cat => cat.toLowerCase() === standardizedName.toLowerCase())) {
          throw new Error(`La catégorie "${standardizedName}" existe déjà.`);
      }
      
      this.updateCategories([...currentCategories, standardizedName]);
  }
  
  deleteCategory(categoryName: string): void {
      const updatedCategories = this.categoriesSubject.getValue().filter(cat => cat !== categoryName);
      this.updateCategories(updatedCategories);
  }

  getAllCategories(): string[] {
      // Les composants peuvent s'abonner à categories$ ou appeler cette méthode
      return this.categoriesSubject.getValue();
  }
  
  // Logique CRUD des transactions
  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    const currentTransactions = this.transactionsSubject.getValue();
    const newId = currentTransactions.length > 0
        ? Math.max(...currentTransactions.map(t => t.id)) + 1
        : 1;

    const newTransaction: Transaction = {
      ...transaction,
      id: newId
    };

    const updatedTransactions = [...currentTransactions, newTransaction];
    this.updateTransactions(updatedTransactions); 
  }

  updateTransaction(updatedTransaction: Transaction): void {
    let currentTransactions = this.transactionsSubject.getValue();
    const index = currentTransactions.findIndex(t => t.id === updatedTransaction.id);

    if (index !== -1) {
      currentTransactions[index] = updatedTransaction;
      this.updateTransactions([...currentTransactions]); 
    }
  }

  deleteTransaction(id: number): void {
      const currentTransactions = this.transactionsSubject.getValue();
      const updatedTransactions = currentTransactions.filter(t => t.id !== id);
      this.updateTransactions(updatedTransactions); 
  }

  getAllTransactions(): Transaction[] {
      return this.transactionsSubject.getValue();
  }

  // Importation JSON (Chargement des données)
  importTransactions(importedData: Transaction[]): void {
      const parsedTransactions = importedData.map(t => ({
          ...t,
          date: new Date(t.date)
      }));
      
      const updatedTransactions = parsedTransactions.map((t, index) => ({
          ...t,
          id: t.id || index + 1
      }));

      // Mise à jour des catégories lors de l'importation si de nouvelles sont détectées
      const newImportedCategories = updatedTransactions
          .map(t => t.category)
          .filter((cat, index, self) => self.indexOf(cat) === index);
          
      const currentCategories = this.categoriesSubject.getValue();
      const categoriesToAdd = newImportedCategories.filter(cat => !currentCategories.includes(cat));

      if (categoriesToAdd.length > 0) {
          this.updateCategories([...currentCategories, ...categoriesToAdd]);
      }
      
      this.updateTransactions(updatedTransactions);
  }
  
  getAllMethods(): string[] {
      const methods = this.transactionsSubject.getValue().map(t => t.method);
      return [...new Set(methods)].sort();
  }
}