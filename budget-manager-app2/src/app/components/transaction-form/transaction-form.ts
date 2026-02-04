import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './transaction-form.html',
  styleUrls: ['./transaction-form.css']
})
export class TransactionForm implements OnInit, OnChanges {
  
  @Input() transactionToEdit: Transaction | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  // Injection du service
  public budgetService = inject(BudgetService);
  
  // Le formulaire réactif
  public transactionForm: FormGroup;
  public isEditMode = false;
  
  // Liste des méthodes pour la boucle *ngFor
  public methods: string[] = ['Carte', 'Espèce', 'Virement', 'Chèque', 'Prélèvement'];

  // Computed pour les sous-catégories basées sur la catégorie sélectionnée
  public availableSubcategories = computed(() => {
    const selectedCategory = this.transactionForm?.get('category')?.value;
    if (!selectedCategory) return [];
    return this.budgetService.getSubcategories(selectedCategory);
  });

  constructor(private fb: FormBuilder) {
    // Création du formulaire "Reactive" attendu par le HTML
    this.transactionForm = this.fb.group({
      id: [null],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category: ['', Validators.required],
      subcategory: [''],
      type: ['Dépense', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      method: ['Carte', Validators.required],
      description: ['']
    });

    // Écouter les changements de catégorie pour réinitialiser la sous-catégorie
    this.transactionForm.get('category')?.valueChanges.subscribe(() => {
      this.transactionForm.patchValue({ subcategory: '' }, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    // Plus besoin de s'abonner à un Observable, les signals sont synchrones
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit'] && this.transactionToEdit) {
      this.isEditMode = true;
      // Remplissage du formulaire pour modification
      this.transactionForm.patchValue({
        ...this.transactionToEdit,
        // Formatage de la date pour l'input HTML type="date"
        date: new Date(this.transactionToEdit.date).toISOString().substring(0, 10),
        subcategory: this.transactionToEdit.subcategory || ''
      });
    } else {
      // Mode Ajout : Reset du formulaire
      this.isEditMode = false;
      this.transactionForm.reset({
        date: new Date().toISOString().substring(0, 10),
        type: 'Dépense',
        method: 'Carte',
        subcategory: ''
      });
    }
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      
      const transactionData = {
        ...formValue,
        // Conversion sécurisée
        amount: Number(formValue.amount),
        date: new Date(formValue.date),
        subcategory: formValue.subcategory || undefined
      };

      // En mode édition, on met à jour
      if (this.isEditMode && this.transactionToEdit) {
        this.budgetService.updateTransaction({
          ...transactionData,
          id: this.transactionToEdit.id
        });
      } else {
        // En mode ajout, on ajoute
        this.budgetService.addTransaction(transactionData);
      }

      this.save.emit(transactionData);
      
      // Reset propre après ajout
      if (!this.isEditMode) {
        this.transactionForm.reset({
          date: new Date().toISOString().substring(0, 10),
          type: 'Dépense',
          method: 'Carte',
          subcategory: ''
        });
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.transactionForm.reset();
  }
}