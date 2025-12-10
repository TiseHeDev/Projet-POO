// src/app/services/budget.service.ts

import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  // Suppression de storageKey
  private transactionsSubject: BehaviorSubject<Transaction[]>;
  public transactions$: Observable<Transaction[]>;

  constructor() {
    // CORRECTION : Initialisation à un tableau vide. 
    // Les données ne sont PAS chargées au démarrage.
    this.transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    this.transactions$ = this.transactionsSubject.asObservable();
  }

  // SUPPRESSION : Suppression des méthodes loadTransactions et saveTransactions
  
  // NOUVEAU: Méthode interne pour notifier les abonnés et mettre à jour le Subject
  private updateTransactions(transactions: Transaction[]): void {
    this.transactionsSubject.next(transactions);
  }

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
    this.updateTransactions(updatedTransactions); // Utilisation de la méthode de mise à jour
  }

  updateTransaction(updatedTransaction: Transaction): void {
    let currentTransactions = this.transactionsSubject.getValue();
    const index = currentTransactions.findIndex(t => t.id === updatedTransaction.id);

    if (index !== -1) {
      currentTransactions[index] = updatedTransaction;
      this.updateTransactions([...currentTransactions]); // Utilisation de la méthode de mise à jour
    }
  }

  deleteTransaction(id: number): void {
      const currentTransactions = this.transactionsSubject.getValue();
      const updatedTransactions = currentTransactions.filter(t => t.id !== id);
      this.updateTransactions(updatedTransactions); // Utilisation de la méthode de mise à jour
  }

  getAllTransactions(): Transaction[] {
      return this.transactionsSubject.getValue();
  }

  // Méthode pour importer/remplacer les transactions (devient la méthode de chargement)
  importTransactions(importedData: Transaction[]): void {
      // Assurer que les dates sont bien des objets Date
      const parsedTransactions = importedData.map(t => ({
          ...t,
          date: new Date(t.date)
      }));
      
      // Assurer des IDs uniques pour le nouveau set
      const updatedTransactions = parsedTransactions.map((t, index) => ({
          ...t,
          id: t.id || index + 1
      }));

      // Mettre à jour et notifier le système
      this.updateTransactions(updatedTransactions);
  }

  getAllCategories(): string[] {
      const categories = this.transactionsSubject.getValue().map(t => t.category);
      return [...new Set(categories)].sort();
  }
  
  getAllMethods(): string[] {
      const methods = this.transactionsSubject.getValue().map(t => t.method);
      return [...new Set(methods)].sort();
  }
}