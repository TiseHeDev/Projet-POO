// src/app/components/dashboard/dashboard.ts

import { Component, OnInit, Output, EventEmitter } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { BudgetService } from '../../services/budget.service';
import { Transaction } from '../../models/transaction.model';
import { Observable, combineLatest, map } from 'rxjs';
import { CashflowSankeyChartComponent } from '../../features/dashboard/cashflow-sankey-chart';

// --- Imports et Initialisation pour le Graphique ---
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js'; 

Chart.register(...registerables); 

interface TopItem { // Renommage pour être générique (Revenu ou Dépense)
  category: string;
  totalAmount: number;
}

// Définir les types de tri
type SortColumn = 'date' | 'category' | 'type' | 'method' | 'amount' | 'description' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CashflowSankeyChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  filteredTransactions$!: Observable<Transaction[]>; 
  totalBalance$!: Observable<number>;
  balanceStatus$!: Observable<'vert' | 'rouge' | 'neutre'>;
  top3Expenses$!: Observable<TopItem[]>;
  top3Revenues$!: Observable<TopItem[]>; // NOUVEAU: Top 3 Revenus
  
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
  @Output() addTransaction = new EventEmitter<void>();
  @Output() manageCategories = new EventEmitter<void>(); 

  constructor(private budgetService: BudgetService) {
    this.lineChartData = {
        datasets: [{ data: [], label: 'Solde Cumulé (€)' }],
        labels: []
    };
  }

  ngOnInit(): void {
    this.budgetService.categories$.subscribe(categories => {
        this.allCategories = categories;
    });

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
    
    // CALCUL DU SOLDE ET STATUT (inchangé)
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
            const items = transactions.filter(t => t.type === 'Dépense');
            
            const categoryTotals = items.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

            return Object.keys(categoryTotals)
                .map(category => ({ category, totalAmount: categoryTotals[category] }))
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 3);
        })
    );

    // NOUVEAU: TOP 3 REVENUS (Logique similaire)
    this.top3Revenues$ = this.filteredTransactions$.pipe(
        map(transactions => {
            const items = transactions.filter(t => t.type === 'Revenu');
            
            const categoryTotals = items.reduce((acc, t) => {
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

  onDelete(id: number, description: string): void {
      if (confirm(`Êtes-vous sûr de vouloir supprimer la transaction : ${description} (ID: ${id}) ?`)) {
          this.budgetService.deleteTransaction(id);
      }
  }

  exportData(): void {
      const transactions = this.budgetService.getAllTransactions();
      
      const serializableData = transactions.map(t => ({
          ...t,
          date: t.date.toISOString()
      }));

      const jsonString = JSON.stringify(serializableData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      const a = document.createElement('a');
      const date = new Date().toISOString().substring(0, 10);
      a.download = `budget_transactions_${date}.json`;
      a.href = URL.createObjectURL(blob);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }
  
  handleFileInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
          alert("Aucun fichier sélectionné.");
          return;
      }
      
      if (!file.name.endsWith('.json')) {
          alert("Veuillez sélectionner un fichier au format .json.");
          return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
          try {
              const content = e.target!.result as string;
              const importedData: Transaction[] = JSON.parse(content);
              
              if (!Array.isArray(importedData)) {
                  throw new Error("Le fichier JSON n'est pas un tableau de transactions valide.");
              }
              
              if (confirm(`Êtes-vous sûr de vouloir remplacer les ${this.budgetService.getAllTransactions().length} transactions actuelles par ${importedData.length} transactions du fichier ?`)) {
                  this.budgetService.importTransactions(importedData);
                  alert(`Importation réussie ! ${importedData.length} transactions chargées.`);
              }
          } catch (error) {
              alert(`Erreur lors du traitement du fichier : ${error}`);
              console.error("Erreur d'importation:", error);
          }
          input.value = ''; 
      };

      reader.readAsText(file);
  }

  openAddModal(): void {
      this.addTransaction.emit();
  }

  openCategoryModal(): void {
      this.manageCategories.emit();
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