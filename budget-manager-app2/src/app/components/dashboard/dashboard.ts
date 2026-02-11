import { Component, Output, EventEmitter, inject, signal, computed } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { BudgetService } from '../../services/budget.service';
import { Transaction } from '../../models/transaction.model';
import { CashflowSankeyChartComponent } from '../../features/dashboard/cashflow-sankey-chart';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js'; 

Chart.register(...registerables); 

interface TopItem {
  category: string;
  subcategory?: string;
  totalAmount: number;
}

type SortColumn = 'date' | 'category' | 'subcategory' | 'type' | 'method' | 'amount' | 'description' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CashflowSankeyChartComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  public budgetService = inject(BudgetService);

  // États locaux
  selectedMonth = signal<string>(''); 
  selectedCategory = signal<string>('');
  selectedLabel = signal<string>('');  // NOUVEAU
  
  currentSortColumn = signal<SortColumn>('date'); 
  currentSortDirection = signal<SortDirection>('desc'); 

  showBalanceChart = signal<boolean>(false);

  allCategories = this.budgetService.categories;

  // Filtrage avec label
  filteredTransactions = computed(() => {
    let list = this.budgetService.transactions();

    // Filtrage par mois
    const month = this.selectedMonth();
    if (month) {
        const [year, m] = month.split('-');
        list = list.filter(t => 
            t.date.getFullYear() === parseInt(year) && 
            t.date.getMonth() === parseInt(m) - 1
        );
    }
    
    // Filtrage par catégorie
    const cat = this.selectedCategory();
    if (cat) {
        list = list.filter(t => t.category === cat);
    }

    // NOUVEAU: Filtrage par label
    const label = this.selectedLabel();
    if (label) {
        list = list.filter(t => t.labels?.includes(label));
    }

    // Tri
    const col = this.currentSortColumn();
    const dir = this.currentSortDirection();

    if (col && dir) {
        list = [...list].sort((a, b) => {
            let aValue: any;
            let bValue: any;
          
            if (col === 'date') {
                aValue = a[col].getTime();
                bValue = b[col].getTime();
            } else if (col === 'amount') {
                aValue = a[col];
                bValue = b[col];
            } else if (col === 'subcategory') {
                aValue = (a.subcategory || '').toLowerCase();
                bValue = (b.subcategory || '').toLowerCase();
            } else {
                aValue = (a[col] as string || '').toLowerCase();
                bValue = (b[col] as string || '').toLowerCase();
            }

            if (aValue < bValue) return dir === 'asc' ? -1 : 1;
            if (aValue > bValue) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return list;
  });

  totalBalance = computed(() => {
    return this.filteredTransactions().reduce((acc, t) => 
        acc + (t.type === 'Revenu' ? t.amount : -t.amount), 0
    );
  });

  balanceStatus = computed(() => {
    const bal = this.totalBalance();
    if (bal > 0) return 'vert';
    if (bal < 0) return 'rouge';
    return 'neutre';
  });

  top3Expenses = computed(() => this.getTopItems('Dépense'));
  top3Revenues = computed(() => this.getTopItems('Revenu'));

  lineChartData = computed(() => {
      const transactions = this.filteredTransactions();
      const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let cumulativeBalance = 0;
      const labels: string[] = [];
      const data: number[] = [];

      sorted.forEach(t => {
          cumulativeBalance += (t.type === 'Revenu' ? t.amount : -t.amount);
          labels.push(this.formatDate(t.date));
          data.push(cumulativeBalance);
      });

      return {
          labels: labels,
          datasets: [{
              data: data,
              label: 'Solde Cumulé (€)',
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.3)',
              tension: 0.3,
              fill: true,
          }]
      };
  });

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, 
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Solde Cumulé (€)' } }
    },
    plugins: { legend: { display: true } }
  };
  public lineChartType: ChartType = 'line';

  @Output() editTransaction = new EventEmitter<Transaction>();
  @Output() addTransaction = new EventEmitter<void>();
  @Output() manageCategories = new EventEmitter<void>();
  @Output() manageLabels = new EventEmitter<void>();  // NOUVEAU

  constructor() {}

  updateMonth(val: string) { this.selectedMonth.set(val); }
  updateCategory(val: string) { this.selectedCategory.set(val); }
  updateLabel(val: string) { this.selectedLabel.set(val); }  // NOUVEAU

  setSort(column: SortColumn): void {
      if (this.currentSortColumn() === column) {
          const newDir = this.currentSortDirection() === 'asc' ? 'desc' : 'asc';
          this.currentSortDirection.set(newDir);
      } else {
          this.currentSortColumn.set(column);
          this.currentSortDirection.set('asc');
      }
  }

  toggleChart(): void {
    this.showBalanceChart.update(v => !v);
  }

  onDelete(id: number, description: string): void {
      if (confirm(`Supprimer la transaction : ${description} ?`)) {
          this.budgetService.deleteTransaction(id);
      }
  }

  onEdit(transaction: Transaction): void {
    this.editTransaction.emit(transaction);
    window.scrollTo(0, 0); 
  }

  // NOUVEAU: Helpers pour afficher les labels
  getLabelColor(labelName: string): string {
    const label = this.budgetService.getLabelByName(labelName);
    return label?.color || '#6b7280';
  }

  getLabelIcon(labelName: string): string | undefined {
    const label = this.budgetService.getLabelByName(labelName);
    return label?.icon;
  }

  private getTopItems(type: 'Revenu' | 'Dépense'): TopItem[] {
    const items = this.filteredTransactions().filter(t => t.type === type);
    const totals: Record<string, number> = {};
    
    items.forEach(t => {
      const key = t.subcategory 
        ? `${t.category} › ${t.subcategory}`
        : t.category;
      totals[key] = (totals[key] || 0) + t.amount;
    });

    return Object.keys(totals)
      .map(key => {
        const parts = key.split(' › ');
        return {
          category: parts[0],
          subcategory: parts[1],
          totalAmount: totals[key]
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3);
  }

  formatDate(date: Date): string {
      return date.toLocaleDateString('fr-FR');
  }

  getStatusClass(status: string): string {
      if (status === 'vert') return 'status-vert';
      if (status === 'rouge') return 'status-rouge';
      return 'status-neutre'; 
  }

  exportData(): void {
      const data = this.budgetService.getAllTransactions().map(t => ({
          ...t, 
          date: t.date.toISOString(),
          subcategory: t.subcategory || undefined,
          labels: t.labels || []  // NOUVEAU
      }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `budget_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
  }
  
  handleFileInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (!input.files?.length) return;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target!.result as string);
              if (confirm(`Remplacer les données par ${data.length} transactions ?`)) {
                  this.budgetService.importTransactions(data);
                  alert('Import réussi !');
              }
          } catch(err) { alert('Erreur fichier invalide'); }
          input.value = '';
      };
      reader.readAsText(file);
  }

  openAddModal() { this.addTransaction.emit(); }
  openCategoryModal() { this.manageCategories.emit(); }
  openLabelModal() { this.manageLabels.emit(); }  // NOUVEAU
}