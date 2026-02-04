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
      height: 350px;
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
            // On nettoie le label pour le tooltip (pour ne pas avoir le montant en double si on veut)
            // Ici je laisse tel quel pour la simplicité, mais on pourrait parser
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

  private cleanLabel(label: string): string {
    return label.replace('__IN', '').replace('__OUT', '');
  }

  private updateChartData(): void {
    if (this.transactions.length === 0) return;

    const incomeTotals: Record<string, number> = {};
    const expenseTotals: Record<string, number> = {};
    const nodeLabels: Record<string, string> = {}; 

    this.totalRevenus = 0;
    this.totalDepenses = 0;
    this.tauxEpargne = 0;

    // 1. Calcul des sommes
    this.transactions.forEach(t => {
      if (t.type === 'Revenu') {
        incomeTotals[t.category] = (incomeTotals[t.category] || 0) + t.amount;
        this.totalRevenus += t.amount;
      } else if (t.type === 'Dépense') {
        expenseTotals[t.category] = (expenseTotals[t.category] || 0) + t.amount;
        this.totalDepenses += t.amount;
      }
    });

    // 2. Calcul du taux
    const solde = this.totalRevenus - this.totalDepenses;
    this.tauxEpargne = this.totalRevenus > 0 ? (solde / this.totalRevenus) * 100 : 0;

    const dataPoints: Array<{ from: string, to: string, flow: number }> = [];
    const centralNode = 'Budget Total';
    
    // Pour le nœud central, on garde juste le nom ou on peut aussi mettre le montant total
    nodeLabels[centralNode] = 'Budget Total';

    // 3. Flux Entrants
    Object.keys(incomeTotals).forEach(cat => {
      const nodeId = cat + '__IN';
      // MODIFICATION ICI : On ajoute le montant à la suite du nom
      nodeLabels[nodeId] = `${cat} : ${incomeTotals[cat].toFixed(2)} €`;
      
      dataPoints.push({ from: nodeId, to: centralNode, flow: incomeTotals[cat] });
    });

    // 4. Flux Sortants
    Object.keys(expenseTotals).forEach(cat => {
      const nodeId = cat + '__OUT';
      // MODIFICATION ICI : On ajoute le montant à la suite du nom
      nodeLabels[nodeId] = `${cat} : ${expenseTotals[cat].toFixed(2)} €`;
      
      dataPoints.push({ from: centralNode, to: nodeId, flow: expenseTotals[cat] });
    });

    // 5. Couleurs
    const getColor = (nodeId: string) => {
      if (nodeId === centralNode) return '#2196F3'; 
      if (nodeId.includes('__IN')) return '#4CAF50'; 
      if (nodeId.includes('__OUT')) return '#F44336'; 
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
          font: { size: 12, weight: 'bold' }
        } as any
      ]
    };
    
    this.chart?.update();
  }
}