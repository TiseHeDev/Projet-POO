// src/app/components/transaction-form/transaction-form.ts

import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../models/transaction.model';
import { Observable } from 'rxjs'; 

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css'
})
export class TransactionForm implements OnInit, OnChanges {
  transactionForm: FormGroup;

  private BASE_METHODS: string[] = ['Carte', 'Espèce', 'Virement', 'Chèque'];
  
  categories$!: Observable<string[]>; // Remplacé par Observable
  methods: string[] = [];   
  
  @Input() transactionToEdit: Transaction | null = null;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  get isEditMode(): boolean {
    return !!this.transactionToEdit;
  }

  constructor(private fb: FormBuilder, private budgetService: BudgetService) {
    this.transactionForm = this.fb.group({
      id: [null], 
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category: ['', Validators.required],
      type: ['Dépense', Validators.required],
      method: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }
  
  ngOnInit(): void {
    // Lie l'Observable du service à la propriété locale
    this.categories$ = this.budgetService.categories$;
    
    this.updateMethods();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit']) {
      if (this.transactionToEdit) {
        this.transactionForm.patchValue({
          id: this.transactionToEdit.id,
          date: this.transactionToEdit.date.toISOString().substring(0, 10),
          category: this.transactionToEdit.category,
          type: this.transactionToEdit.type,
          method: this.transactionToEdit.method,
          amount: this.transactionToEdit.amount,
          description: this.transactionToEdit.description
        });
        this.updateMethods(); 
      } else {
        this.resetForm();
      }
    }
  }

  private updateMethods(): void {
      const existingMethods = this.budgetService.getAllMethods();
      this.methods = [...new Set([...this.BASE_METHODS, ...existingMethods])].sort();
  }
  
  private resetForm(): void {
      this.transactionForm.reset({
        date: new Date().toISOString().substring(0, 10),
        type: 'Dépense',
        id: null
      });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;

      const transactionData = {
        id: formValue.id,
        date: new Date(formValue.date),
        category: formValue.category,
        type: formValue.type,
        method: formValue.method,
        amount: +formValue.amount,
        description: formValue.description
      };

      if (this.isEditMode) {
        this.budgetService.updateTransaction(transactionData as Transaction);
        alert('Transaction modifiée avec succès !');
        this.formSubmitted.emit(); 
      } else {
        this.budgetService.addTransaction(transactionData);
        alert('Transaction ajoutée !');
        this.updateMethods(); 
      }
      
      this.resetForm();
    }
  }
  
  onCancel(): void {
      this.resetForm();
      this.formCancelled.emit();
  }
}