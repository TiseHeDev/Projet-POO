// src/app/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ITransaction, IBudgetSummary } from '../models/transaction.model';
// ATTENTION : Import depuis le fichier transaction.ts (votre service)
import { TransactionService } from '../transaction'; 
import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  transactions: ITransaction[] = [];
  summary: IBudgetSummary = {} as IBudgetSummary;
  top3Depenses: ITransaction[] = [];
  private transactionSubscription!: Subscription; 

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadData();

    // Abonnement pour la réactivité (RxJS)
    this.transactionSubscription = this.transactionService.transactionsUpdated$.subscribe(
      updatedTransactions => {
        this.loadData(updatedTransactions);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }
  }

  loadData(data?: ITransaction[]): void {
    const currentTransactions = data || this.transactionService.getTransactions();

    this.transactions = currentTransactions;
    this.summary = this.transactionService.calculateSummary(this.transactions);
    this.calculateTop3Expenses(this.transactions);
  }

  calculateTop3Expenses(allTransactions: ITransaction[]): void {
    const expenses = allTransactions.filter(t => t.montant < 0);
    this.top3Depenses = expenses
      .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant))
      .slice(0, 3);
  }
}