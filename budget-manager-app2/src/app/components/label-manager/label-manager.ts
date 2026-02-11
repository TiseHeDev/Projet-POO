import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { Label } from '../../models/transaction.model';

@Component({
  selector: 'app-label-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './label-manager.html',
  styleUrl: './label-manager.css'
})
export class LabelManager {
  public budgetService = inject(BudgetService);
  
  newLabelName: string = '';
  newLabelIcon: string = '';
  selectedColor: string = '#3b82f6';
  errorMessage: string | null = null;
  
  // Signal pour afficher les stats d'un label
  showingStatsFor = signal<string | null>(null);
  
  // Couleurs prédéfinies
  predefinedColors: string[] = [
    '#3b82f6', // Bleu
    '#ec4899', // Rose
    '#10b981', // Vert
    '#f59e0b', // Orange
    '#8b5cf6', // Violet
    '#ef4444', // Rouge
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#f97316', // Orange vif
    '#06b6d4'  // Cyan
  ];
  
  // Emojis par défaut pour les labels
  predefinedEmojis: string[] = [
    '✈️', '🎂', '🎄', '💍', '🚨', '🏖️', '🎓', '💼', 
    '🏥', '🚗', '🏠', '🎮', '🎭', '🎵', '📚', '⚽'
  ];
  
  addLabel(): void {
    if (!this.newLabelName.trim()) {
      this.errorMessage = "Le nom du label ne peut pas être vide.";
      return;
    }
    
    try {
      const newLabel: Label = {
        name: this.newLabelName.trim(),
        color: this.selectedColor,
        icon: this.newLabelIcon || undefined
      };
      
      this.budgetService.addLabel(newLabel);
      this.newLabelName = '';
      this.newLabelIcon = '';
      this.selectedColor = '#3b82f6';
      this.errorMessage = null;
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  deleteLabel(labelName: string): void {
    if (confirm(`Supprimer le label "${labelName}" ?`)) {
      try {
        this.budgetService.deleteLabel(labelName);
        this.errorMessage = null;
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }

  toggleStats(labelName: string): void {
    const current = this.showingStatsFor();
    if (current === labelName) {
      this.showingStatsFor.set(null);
    } else {
      this.showingStatsFor.set(labelName);
    }
  }

  getLabelStats(labelName: string) {
    const stats = this.budgetService.getTotalByLabel(labelName);
    const transactions = this.budgetService.getTransactionsByLabel(labelName);
    return {
      ...stats,
      count: transactions.length
    };
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  selectEmoji(emoji: string): void {
    this.newLabelIcon = emoji;
  }
}