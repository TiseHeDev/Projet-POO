// src/app/models/transaction.model.ts

export interface Transaction {
  id: number;
  date: Date;
  category: string; 
  parentCategory?: string; // Optionnel : pour le regroupement dans le diagramme de Sankey
  type: 'Revenu' | 'Dépense'; 
  method: string; 
  amount: number;
  description?: string; 
}