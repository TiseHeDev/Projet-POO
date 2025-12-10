// src/app/components/transaction-form/transaction-form.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css'
})
export class TransactionForm implements OnInit { // Implémentation de OnInit pour la logique d'initialisation
  transactionForm: FormGroup;

  // 1. Définir les listes de base (pour garantir la présence des catégories principales)
  private BASE_CATEGORIES: string[] = ['Nourriture', 'Logement', 'Transport', 'Loisirs', 'Santé', 'Salaire', 'Autre'];
  private BASE_METHODS: string[] = ['Carte', 'Espèce', 'Virement', 'Chèque'];
  
  categories: string[] = []; // Liste affichée dans le formulaire
  methods: string[] = [];   // Liste affichée dans le formulaire

  constructor(private fb: FormBuilder, private budgetService: BudgetService) {
    this.transactionForm = this.fb.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category: ['', Validators.required],
      type: ['Dépense', Validators.required],
      method: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }
  
  ngOnInit(): void {
    this.updateLists();
  }
  
  /**
   * Combine les listes de base et les catégories/méthodes existantes dans le service.
   */
  private updateLists(): void {
      // Catégories
      const existingCategories = this.budgetService.getAllCategories();
      // Utilise un Set pour obtenir les valeurs uniques puis les trie
      this.categories = [...new Set([...this.BASE_CATEGORIES, ...existingCategories])].sort();
      
      // Moyens de paiement
      const existingMethods = this.budgetService.getAllMethods();
      this.methods = [...new Set([...this.BASE_METHODS, ...existingMethods])].sort();
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;

      const newTransaction = {
        date: new Date(formValue.date),
        category: formValue.category,
        type: formValue.type,
        method: formValue.method,
        amount: +formValue.amount,
        description: formValue.description
      };

      this.budgetService.addTransaction(newTransaction);
      alert('Transaction ajoutée et stockée localement !');
      
      // Après l'ajout, mettez à jour les listes pour inclure la nouvelle catégorie/méthode si elle était nouvelle
      this.updateLists(); 

      // Réinitialiser le formulaire
      this.transactionForm.reset({
        date: new Date().toISOString().substring(0, 10),
        type: 'Dépense'
      });
    }
  }
}