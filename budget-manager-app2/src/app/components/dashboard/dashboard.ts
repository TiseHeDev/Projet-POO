// src/app/components/dashboard/dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { BudgetService } from '../../services/budget.service';
import { Transaction } from '../../models/transaction.model';
import { Observable, combineLatest, map, of } from 'rxjs'; // Ajout de 'of'

// Interface pour les Top 3 Dépenses
interface TopExpense {
  category: string;
  totalAmount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  // L'opérateur "!" (non-null assertion operator) indique que la propriété sera initialisée plus tard (dans ngOnInit)
  filteredTransactions$!: Observable<Transaction[]>; 
  totalBalance$!: Observable<number>;
  balanceStatus$!: Observable<'vert' | 'rouge' | 'neutre'>;
  top3Expenses$!: Observable<TopExpense[]>;
  
  // Variables de Filtre
  selectedMonth: string = ''; 
  selectedCategory: string = '';
  // La liste des catégories doit être réinitialisée dans ngOnInit ou au constructeur pour se mettre à jour
  allCategories: string[] = []; 

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    // Mise à jour des catégories disponibles (au cas où elles ont changé)
    this.allCategories = this.budgetService.getAllCategories();

    // ... (Le reste de la logique des Observables reste inchangé) ...

    // 1. Définition des transactions filtrées
    this.filteredTransactions$ = combineLatest([
        this.budgetService.transactions$
    ]).pipe(
        map(([transactions]) => {
            let filtered = transactions.slice();
            
            // Filtre par Mois
            if (this.selectedMonth) {
                const [year, month] = this.selectedMonth.split('-');
                filtered = filtered.filter(t => 
                    t.date.getFullYear() === parseInt(year) && 
                    t.date.getMonth() === parseInt(month) - 1
                );
            }

            // Filtre par Catégorie
            if (this.selectedCategory) {
                filtered = filtered.filter(t => t.category === this.selectedCategory);
            }
            
            return filtered;
        })
    );
    
    // 2. Calcul du Solde Total
    this.totalBalance$ = this.filteredTransactions$.pipe(
        map(transactions => 
            transactions.reduce((acc, t) => 
                acc + (t.type === 'Revenu' ? t.amount : -t.amount), 0
            )
        )
    );

    // 3. Détermination du Statut (Rouge/Vert)
    this.balanceStatus$ = this.totalBalance$.pipe(
        map(balance => {
            if (balance > 0) return 'vert';
            if (balance < 0) return 'rouge';
            return 'neutre';
        })
    );

    // 4. Calcul des Top 3 Dépenses
    this.top3Expenses$ = this.filteredTransactions$.pipe(
        map(transactions => {
            const expenses = transactions.filter(t => t.type === 'Dépense');
            
            const categoryTotals = expenses.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

            return Object.keys(categoryTotals)
                .map(category => ({ 
                    category, 
                    totalAmount: categoryTotals[category] 
                }))
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 3);
        })
    );
  }
  
  applyFilters(): void {
    // Forcer la réinitialisation des observables avec les nouvelles valeurs de filtre
    this.ngOnInit(); 
  }

  formatDate(date: Date): string {
      return date.toLocaleDateString('fr-FR');
  }

  /**
   * CORRECTION DE L'ERREUR TS2345
   * Accepte le type 'vert' | 'rouge' | 'neutre' | null pour gérer la valeur initiale du pipe async.
   */
  getStatusClass(status: 'vert' | 'rouge' | 'neutre' | null): string {
      // Si 'status' est null (avant la première émission de l'Observable), on retourne 'neutre' ou une classe par défaut.
      if (!status || status === 'neutre') return 'status-neutre';
      if (status === 'vert') return 'status-vert';
      if (status === 'rouge') return 'status-rouge';
      
      // Retour par défaut si jamais
      return 'status-neutre'; 
  }
}