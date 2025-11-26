// src/app/transaction-form/transaction-form.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// ATTENTION : L'import se fait depuis le fichier transaction.ts (votre service)
import { TransactionService } from '../transaction'; 
import { ITransaction } from '../models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css']
})
export class TransactionFormComponent implements OnInit {
  transactionForm!: FormGroup; 
  categories: string[] = ['Nourriture', 'Loyer', 'Salaire', 'Transport', 'Loisirs'];
  typesPaiement: string[] = ['Carte', 'Espèce', 'Virement', 'Chèque'];
  typeTransaction: string[] = ['Dépense', 'Revenu'];

  // Injection du FormBuilder et du TransactionService
  constructor(
    private fb: FormBuilder, 
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      type: ['Dépense', Validators.required],
      montant: [null, [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      categorie: [this.categories[0], Validators.required],
      typePaiement: [this.typesPaiement[0], Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  onSubmit() {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;

      // Construction de l'objet POO
      const newTransaction: ITransaction = {
        id: 0, 
        date: new Date(formValue.date),
        description: formValue.description,
        categorie: formValue.categorie,
        typePaiement: formValue.typePaiement,
        // Logique pour s'assurer que le montant a le bon signe (+/-)
        montant: formValue.type === 'Dépense' 
                 ? -Math.abs(formValue.montant) 
                 : Math.abs(formValue.montant),
      };

      // Appel au service (Encapsulation)
      this.transactionService.addTransaction(newTransaction);
      alert('Transaction enregistrée !');

      this.transactionForm.reset({
          type: 'Dépense',
          categorie: this.categories[0],
          typePaiement: this.typesPaiement[0],
          date: new Date().toISOString().substring(0, 10)
      });
    }
  }
}