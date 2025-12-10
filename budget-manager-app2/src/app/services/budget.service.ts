// src/app/services/budget.service.ts

import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private storageKey = 'budget_transactions';
  private transactionsSubject: BehaviorSubject<Transaction[]>;
  public transactions$: Observable<Transaction[]>;

  constructor() {
    const initialTransactions = this.loadTransactions();
    this.transactionsSubject = new BehaviorSubject<Transaction[]>(initialTransactions);
    this.transactions$ = this.transactionsSubject.asObservable();
  }

  private loadTransactions(): Transaction[] {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      try {
        const transactions = JSON.parse(data) as Transaction[];
        return transactions.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      } catch (e) {
        console.error("Erreur lors de la lecture du localStorage", e);
        return [];
      }
    }
    return [];
  }

  private saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(transactions));
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
    this.saveTransactions(updatedTransactions);
  }

  updateTransaction(updatedTransaction: Transaction): void {
    let currentTransactions = this.transactionsSubject.getValue();
    const index = currentTransactions.findIndex(t => t.id === updatedTransaction.id);

    if (index !== -1) {
      currentTransactions[index] = updatedTransaction;
      this.saveTransactions([...currentTransactions]); 
    }
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