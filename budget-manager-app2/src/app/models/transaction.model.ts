// src/app/models/transaction.model.ts

export interface Transaction {
  id: number;
  date: Date;
  category: string; // Ex: 'Nourriture', 'Logement', 'Loisirs'
  type: 'Revenu' | 'Dépense'; // Pour savoir si c'est un gain ou une perte
  method: string; // Ex: 'Carte', 'Espèce', 'Virement'
  amount: number;
  description?: string; // Optionnel
}