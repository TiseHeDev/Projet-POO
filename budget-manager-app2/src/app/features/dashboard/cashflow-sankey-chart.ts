import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { Transaction } from '../../models/transaction.model';

Chart.register(SankeyController, Flow);

@Component({
  selector: 'app-cashflow-sankey-chart',
  standalone: true,
  imports: [BaseChartDirective, CommonModule],
  template: `
    <div class="sankey-container">
      
      <div class="chart-wrapper">
        <canvas baseChart
          [data]="sankeyData"
          [options]="sankeyOptions"
          [type]="sankeyType">
        </canvas>
      </div>

      <div class="stats-bar" *ngIf="transactions.length > 0">
        <div class="stat-item income">
          <span class="label">Total Entrées</span>
          <span class="value">+{{ totalRevenus | number:'1.0-0' }} €</span>
        </div>
        
        <div class="stat-divider"></div>
        
        <div class="stat-item expense">
          <span class="label">Total Sorties</span>
          <span class="value">-{{ totalDepenses | number:'1.0-0' }} €</span>
        </div>
        
        <div class="stat-divider"></div>
        
        <div class="stat-item savings" [ngClass]="{'negative': tauxEpargne < 0}">
          <span class="label">Taux d'Épargne</span>
          <span class="value">{{ tauxEpargne | number:'1.1-1' }}%</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .sankey-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chart-wrapper {
      position: relative;
      height: 450px;
      width: 100%;
    }
    .stats-bar {
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      background-color: #fafafa;
      border-radius: 0 0 8px 8px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Segoe UI', sans-serif;
    }
    .label {
      font-size: 0.85rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .value {
      font-size: 1.2rem;
      font-weight: bold;
    }
    .income .value { color: #28a745; }
    .expense .value { color: #dc3545; }
    .savings .value { color: #2196F3; }
    .savings.negative .value { color: #ff9800; }
    
    .stat-divider {
      width: 1px;
      height: 30px;
      background-color: #e0e0e0;
    }
  `]
})
export class CashflowSankeyChartComponent implements OnChanges {
  @Input() transactions: Transaction[] = [];
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public sankeyType: ChartType = 'sankey' as ChartType;
  public sankeyData: ChartData = { datasets: [] };

  public totalRevenus: number = 0;
  public totalDepenses: number = 0;
  public tauxEpargne: number = 0;

  public sankeyOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: false },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const item = context.raw;
            return `${item.from} → ${item.to} : ${item.flow.toFixed(2)} €`;
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] && this.transactions) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (this.transactions.length === 0) return;

    // Structure hiérarchique: Catégorie -> Sous-catégorie
    const incomeByCategory: Record<string, number> = {};
    const incomeBySubcategory: Record<string, Record<string, number>> = {};
    
    const expenseByCategory: Record<string, number> = {};
    const expenseBySubcategory: Record<string, Record<string, number>> = {};
    
    const nodeLabels: Record<string, string> = {};

    this.totalRevenus = 0;
    this.totalDepenses = 0;
    this.tauxEpargne = 0;

    // 1. Calcul des sommes par catégorie et sous-catégorie
    this.transactions.forEach(t => {
      const subcat = t.subcategory || 'Général';
      
      if (t.type === 'Revenu') {
        // Revenus par catégorie
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        
        // Revenus par sous-catégorie
        if (!incomeBySubcategory[t.category]) {
          incomeBySubcategory[t.category] = {};
        }
        incomeBySubcategory[t.category][subcat] = 
          (incomeBySubcategory[t.category][subcat] || 0) + t.amount;
        
        this.totalRevenus += t.amount;
      } else if (t.type === 'Dépense') {
        // Dépenses par catégorie
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        
        // Dépenses par sous-catégorie
        if (!expenseBySubcategory[t.category]) {
          expenseBySubcategory[t.category] = {};
        }
        expenseBySubcategory[t.category][subcat] = 
          (expenseBySubcategory[t.category][subcat] || 0) + t.amount;
        
        this.totalDepenses += t.amount;
      }
    });

    // 2. Calcul du taux d'épargne
    const solde = this.totalRevenus - this.totalDepenses;
    this.tauxEpargne = this.totalRevenus > 0 ? (solde / this.totalRevenus) * 100 : 0;

    const dataPoints: Array<{ from: string, to: string, flow: number }> = [];
    const centralNode = 'Budget Total';
    
    nodeLabels[centralNode] = `Budget Total\n${this.totalRevenus.toFixed(0)}€`;

    // 3. Flux Entrants (3 niveaux: Sous-catégorie -> Catégorie -> Budget)
    Object.keys(incomeByCategory).forEach(category => {
      const categoryNodeId = `${category}__CAT_IN`;
      const categoryTotal = incomeByCategory[category];
      
      nodeLabels[categoryNodeId] = `${category}\n${categoryTotal.toFixed(0)}€`;
      
      // Flux: Catégorie -> Budget Central
      dataPoints.push({ 
        from: categoryNodeId, 
        to: centralNode, 
        flow: categoryTotal 
      });

      // Sous-catégories -> Catégorie
      const subcats = incomeBySubcategory[category];
      if (subcats) {
        Object.keys(subcats).forEach(subcat => {
          const subcatNodeId = `${category}__${subcat}__IN`;
          const subcatAmount = subcats[subcat];
          
          nodeLabels[subcatNodeId] = `${subcat}\n${subcatAmount.toFixed(0)}€`;
          
          // Flux: Sous-catégorie -> Catégorie
          dataPoints.push({ 
            from: subcatNodeId, 
            to: categoryNodeId, 
            flow: subcatAmount 
          });
        });
      }
    });

    // 4. Flux Sortants (3 niveaux: Budget -> Catégorie -> Sous-catégorie)
    Object.keys(expenseByCategory).forEach(category => {
      const categoryNodeId = `${category}__CAT_OUT`;
      const categoryTotal = expenseByCategory[category];
      
      nodeLabels[categoryNodeId] = `${category}\n${categoryTotal.toFixed(0)}€`;
      
      // Flux: Budget Central -> Catégorie
      dataPoints.push({ 
        from: centralNode, 
        to: categoryNodeId, 
        flow: categoryTotal 
      });

      // Catégorie -> Sous-catégories
      const subcats = expenseBySubcategory[category];
      if (subcats) {
        Object.keys(subcats).forEach(subcat => {
          const subcatNodeId = `${category}__${subcat}__OUT`;
          const subcatAmount = subcats[subcat];
          
          nodeLabels[subcatNodeId] = `${subcat}\n${subcatAmount.toFixed(0)}€`;
          
          // Flux: Catégorie -> Sous-catégorie
          dataPoints.push({ 
            from: categoryNodeId, 
            to: subcatNodeId, 
            flow: subcatAmount 
          });
        });
      }
    });

    // 5. Couleurs par niveau
    const getColor = (nodeId: string) => {
      if (nodeId === centralNode) return '#2196F3'; // Bleu pour le centre
      
      // Revenus (vert avec nuances)
      if (nodeId.includes('__IN')) {
        if (nodeId.includes('__CAT_IN')) return '#28a745'; // Catégories revenus (vert foncé)
        return '#5cb85c'; // Sous-catégories revenus (vert clair)
      }
      
      // Dépenses (rouge avec nuances)
      if (nodeId.includes('__OUT')) {
        if (nodeId.includes('__CAT_OUT')) return '#dc3545'; // Catégories dépenses (rouge foncé)
        return '#f86c6b'; // Sous-catégories dépenses (rouge clair)
      }
      
      return '#888888';
    };

    // 6. Assignation
    this.sankeyData = {
      datasets: [
        {
          data: dataPoints,
          labels: nodeLabels,
          colorFrom: (c: any) => getColor(c.raw.from),
          colorTo: (c: any) => getColor(c.raw.to),
          colorMode: 'gradient',
          borderWidth: 0,
          font: { size: 11, weight: 'bold' },
          size: 'max',
          priority: {
            [centralNode]: 100
          }
        } as any
      ]
    };
    
    this.chart?.update();
  }
}