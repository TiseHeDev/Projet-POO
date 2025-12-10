// src/app/components/dashboard/dashboard.ts

import { Component, OnInit, Output, EventEmitter } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { BudgetService } from '../../services/budget.service';
import { Transaction } from '../../models/transaction.model';
import { Observable, combineLatest, map } from 'rxjs';

// --- Imports et Initialisation pour le Graphique ---
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js'; 

Chart.register(...registerables); 

interface TopExpense {
  category: string;
  totalAmount: number;
}

// Définir les types de tri
type SortColumn = 'date' | 'category' | 'type' | 'method' | 'amount' | 'description' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  filteredTransactions$!: Observable<Transaction[]>; 
  totalBalance$!: Observable<number>;
  balanceStatus$!: Observable<'vert' | 'rouge' | 'neutre'>;
  top3Expenses$!: Observable<TopExpense[]>;
  
  // Variables de Filtre
  selectedMonth: string = ''; 
  selectedCategory: string = '';
  allCategories: string[] = [];

  // --- Propriétés du Tri ---
  currentSortColumn: SortColumn = 'date'; 
  currentSortDirection: SortDirection = 'desc'; 

  // --- Propriétés du Graphique ---
  showBalanceChart: boolean = false; 
  
  public lineChartData!: ChartConfiguration['data']; 
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, 
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Solde Cumulé (€)' } }
    },
    plugins: {
      legend: { display: true }
    }
  };
  public lineChartType: ChartType = 'line';

  @Output() editTransaction = new EventEmitter<Transaction>();

  constructor(private budgetService: BudgetService) {
    this.lineChartData = {
        datasets: [{ data: [], label: 'Solde Cumulé (€)' }],
        labels: []
    };
  }

  ngOnInit(): void {
    this.allCategories = this.budgetService.getAllCategories();

    this.filteredTransactions$ = combineLatest([
        this.budgetService.transactions$
    ]).pipe(
        map(([transactions]) => {
            let filtered = transactions.slice();
            
            // 1. FILTRAGE
            if (this.selectedMonth) {
                const [year, month] = this.selectedMonth.split('-');
                filtered = filtered.filter(t => 
                    t.date.getFullYear() === parseInt(year) && 
                    t.date.getMonth() === parseInt(month) - 1
                );
            }
            if (this.selectedCategory) {
                filtered = filtered.filter(t => t.category === this.selectedCategory);
            }
            
            // 2. TRI APPLIQUÉ
            this.sortTransactions(filtered, this.currentSortColumn, this.currentSortDirection);

            // 3. Mise à jour du graphique si affiché
            if (this.showBalanceChart) {
                this.updateBalanceChart(filtered);
            }
            
            return filtered;
        })
    );
    
    // CALCUL DU SOLDE ET STATUT
    this.totalBalance$ = this.filteredTransactions$.pipe(
        map(transactions => 
            transactions.reduce((acc, t) => 
                acc + (t.type === 'Revenu' ? t.amount : -t.amount), 0
            )
        )
    );

    this.balanceStatus$ = this.totalBalance$.pipe(
        map(balance => {
            if (balance > 0) return 'vert';
            if (balance < 0) return 'rouge';
            return 'neutre';
        })
    );

    // TOP 3 DÉPENSES
    this.top3Expenses$ = this.filteredTransactions$.pipe(
        map(transactions => {
            const expenses = transactions.filter(t => t.type === 'Dépense');
            const categoryTotals = expenses.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

            return Object.keys(categoryTotals)
                .map(category => ({ category, totalAmount: categoryTotals[category] }))
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 3);
        })
    );
  }
  
  private sortTransactions(transactions: Transaction[], column: SortColumn, direction: SortDirection): void {
      if (!column || !direction) {
          return;
      }

      transactions.sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          if (column === 'date') {
              aValue = a[column].getTime();
              bValue = b[column].getTime();
          } else if (column === 'amount') {
              aValue = a[column];
              bValue = b[column];
          } else {
              aValue = (a[column] as string || '').toLowerCase();
              bValue = (b[column] as string || '').toLowerCase();
          }

          if (aValue < bValue) {
              return direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
              return direction === 'asc' ? 1 : -1;
          }
          return 0;
      });
  }

  setSort(column: SortColumn): void {
      if (this.currentSortColumn === column) {
          this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
          this.currentSortColumn = column;
          this.currentSortDirection = 'asc';
      }
      this.applyFilters(); 
  }

  // NOUVEAU: Méthode pour la suppression
  onDelete(id: number, description: string): void {
      if (confirm(`Êtes-vous sûr de vouloir supprimer la transaction : ${description} (ID: ${id}) ?`)) {
          this.budgetService.deleteTransaction(id);
          // Le service notifie tous les abonnés (le dashboard) via l'Observable,
          // donc l'affichage devrait se mettre à jour automatiquement.
      }
  }

  applyFilters(): void {
    this.ngOnInit(); 
  }

  updateBalanceChart(transactions: Transaction[]): void {
      const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let cumulativeBalance = 0;
      const labels: string[] = []; 
      const data: number[] = [];    

      sortedTransactions.forEach(t => {
          const amount = t.type === 'Revenu' ? t.amount : -t.amount;
          cumulativeBalance += amount;
          
          labels.push(this.formatDate(t.date)); 
          data.push(cumulativeBalance);
      });
      
      this.lineChartData = {
          labels: labels,
          datasets: [
              {
                  data: data,
                  label: 'Solde Cumulé (€)',
                  borderColor: '#007bff',
                  backgroundColor: 'rgba(0, 123, 255, 0.3)',
                  tension: 0.3, 
                  fill: true,
              }
          ]
      };
  }

  toggleChart(): void {
    this.showBalanceChart = !this.showBalanceChart;
    if (this.showBalanceChart) {
        this.applyFilters(); 
    }
  }

  onEdit(transaction: Transaction): void {
    this.editTransaction.emit(transaction);
    window.scrollTo(0, 0); 
  }
  
  formatDate(date: Date): string {
      return date.toLocaleDateString('fr-FR');
  }

  getStatusClass(status: 'vert' | 'rouge' | 'neutre' | null): string {
      if (!status || status === 'neutre') return 'status-neutre';
      if (status === 'vert') return 'status-vert';
      if (status === 'rouge') return 'status-rouge';
      return 'status-neutre'; 
  }
}