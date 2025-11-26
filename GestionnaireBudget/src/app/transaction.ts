// src/app/transaction.ts

import { Injectable } from '@angular/core';
// Assurez-vous que le chemin vers le modèle est correct (dossier models)
import { ITransaction, IBudgetSummary } from './models/transaction.model';
import { Subject } from 'rxjs'; // Pour la réactivité

@Injectable({
  providedIn: 'root'
})
// Le nom de la classe reste 'TransactionService' pour la clarté,
// même si le nom du fichier est 'transaction.ts'.
export class TransactionService {
  private transactionsKey = 'budget_transactions';

  // Le Subject pour notifier le Dashboard après un changement (clé de la réactivité)
  private transactionsUpdatedSource = new Subject<ITransaction[]>();
  transactionsUpdated$ = this.transactionsUpdatedSource.asObservable();

  constructor() { }

  // --- Opérations de base (Lecture/Écriture Local Storage) ---

  getTransactions(): ITransaction[] {
    const data = localStorage.getItem(this.transactionsKey);
    if (data) {
      const transactions = JSON.parse(data) as ITransaction[];
      return transactions.map(t => ({ ...t, date: new Date(t.date) }));
    }
    return [];
  }

  addTransaction(transaction: ITransaction): void {
    const transactions = this.getTransactions();

    const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    transaction.id = newId;

    transactions.push(transaction);
    this.saveTransactions(transactions);

    // 👈 ENCAPSULATION & NOTIFICATION
    this.transactionsUpdatedSource.next(transactions); 
  }

  private saveTransactions(transactions: ITransaction[]): void {
    localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));
  }

  // --- Logique Métier (Calculs Dashboard) ---

  calculateSummary(transactions: ITransaction[]): IBudgetSummary {
    const revenus = transactions
      .filter(t => t.montant > 0)
      .reduce((sum, t) => sum + t.montant, 0);

    const depenses = transactions
      .filter(t => t.montant < 0)
      .reduce((sum, t) => sum + t.montant, 0);

    const solde = revenus + depenses;

    return {
      solde,
      revenusTotal: revenus,
      depensesTotal: Math.abs(depenses),
      estDansLeVert: solde >= 0
    };
  }
}