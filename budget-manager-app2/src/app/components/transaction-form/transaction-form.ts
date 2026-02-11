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

  public budgetService = inject(BudgetService);
  
  public transactionForm: FormGroup;
  public isEditMode = false;
  
  public methods: string[] = ['Carte', 'Espèce', 'Virement', 'Chèque', 'Prélèvement'];

  // Signal pour forcer la réactivité de la catégorie
  private selectedCategorySignal = signal<string>('');

  public availableSubcategories = computed(() => {
    const category = this.selectedCategorySignal();
    if (!category) return [];
    return this.budgetService.getSubcategories(category);
  });

  // NOUVEAU: Signal pour les labels sélectionnés
  public selectedLabels = signal<string[]>([]);

  constructor(private fb: FormBuilder) {
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

    this.transactionForm.get('category')?.valueChanges.subscribe((newCategory) => {
      this.selectedCategorySignal.set(newCategory || '');
      this.transactionForm.patchValue({ subcategory: '' }, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    const initialCategory = this.transactionForm.get('category')?.value;
    if (initialCategory) {
      this.selectedCategorySignal.set(initialCategory);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactionToEdit'] && this.transactionToEdit) {
      this.isEditMode = true;
      
      const categoryValue = this.transactionToEdit.category;
      
      this.transactionForm.patchValue({
        ...this.transactionToEdit,
        date: new Date(this.transactionToEdit.date).toISOString().substring(0, 10),
        subcategory: this.transactionToEdit.subcategory || ''
      });
      
      this.selectedCategorySignal.set(categoryValue);
      
      // NOUVEAU: Charger les labels existants
      this.selectedLabels.set(this.transactionToEdit.labels || []);
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  resetForm(): void {
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
    
    this.selectedCategorySignal.set('');
    this.selectedLabels.set([]);  // NOUVEAU: Reset des labels
  }

  // NOUVEAU: Gestion des labels
  toggleLabel(labelName: string): void {
    const current = this.selectedLabels();
    if (current.includes(labelName)) {
      this.selectedLabels.set(current.filter(l => l !== labelName));
    } else {
      this.selectedLabels.set([...current, labelName]);
    }
  }

  isLabelSelected(labelName: string): boolean {
    return this.selectedLabels().includes(labelName);
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      
      const transactionData = {
        ...formValue,
        amount: Number(formValue.amount),
        date: new Date(formValue.date),
        subcategory: formValue.subcategory || undefined,
        labels: this.selectedLabels()  // NOUVEAU: Ajout des labels
      };

      if (this.isEditMode && this.transactionToEdit) {
        this.budgetService.updateTransaction({
          ...transactionData,
          id: this.transactionToEdit.id
        });
      } else {
        this.budgetService.addTransaction(transactionData);
      }

      this.save.emit(transactionData);
      
      if (!this.isEditMode) {
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