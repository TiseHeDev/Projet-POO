import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, inject, signal, computed } from '@angular/core';
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

  // Signal pour forcer la réactivité
  private selectedCategorySignal = signal<string>('');

  // Computed basé sur le signal pour forcer la mise à jour
  public availableSubcategories = computed(() => {
    const category = this.selectedCategorySignal();
    if (!category) return [];
    return this.budgetService.getSubcategories(category);
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

    // Écouter les changements de catégorie
    this.transactionForm.get('category')?.valueChanges.subscribe((newCategory) => {
      // Mettre à jour le signal pour déclencher le computed
      this.selectedCategorySignal.set(newCategory || '');
      
      // Reset de la sous-catégorie
      this.transactionForm.patchValue({ subcategory: '' }, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    // Initialiser le signal avec la valeur actuelle
    const initialCategory = this.transactionForm.get('category')?.value;
    if (initialCategory) {
      this.selectedCategorySignal.set(initialCategory);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit'] && this.transactionToEdit) {
      this.isEditMode = true;
      
      // Remplissage du formulaire pour modification
      const categoryValue = this.transactionToEdit.category;
      
      this.transactionForm.patchValue({
        ...this.transactionToEdit,
        date: new Date(this.transactionToEdit.date).toISOString().substring(0, 10),
        subcategory: this.transactionToEdit.subcategory || ''
      });
      
      // Mettre à jour le signal avec la catégorie de la transaction
      this.selectedCategorySignal.set(categoryValue);
    } else {
      // Mode Ajout : Reset du formulaire
      this.isEditMode = false;
      this.resetForm();
    }
  }

  resetForm(): void {
    // Reset complet du formulaire
    this.transactionForm.reset({
      date: new Date().toISOString().substring(0, 10),
      type: 'Dépense',
      method: 'Carte',
      category: '',
      subcategory: '',
      description: '',
      amount: null,
      id: null
    });
    
    // CRUCIAL : Réinitialiser le signal pour vider les sous-catégories
    this.selectedCategorySignal.set('');
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
      
      // Reset complet après ajout (pas en mode édition)
      if (!this.isEditMode) {
        // Utiliser setTimeout pour s'assurer que le reset se fait après l'émission
        setTimeout(() => {
          this.resetForm();
        }, 0);
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }
}