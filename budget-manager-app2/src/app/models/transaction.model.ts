// src/app/models/transaction.model.ts

export interface Transaction {
  id: number;
  date: Date;
  category: string;
  subcategory?: string; // Pour les sous-catégories
  type: 'Revenu' | 'Dépense';
  method: string;
  amount: number;
  description?: string;
  labels?: string[]; // NOUVEAU : Liste des noms de labels
  parentCategory?: string; // Gardé pour compatibilité éventuelle
}

export interface CategoryStructure {
  name: string;
  subcategories: string[];
}

export interface Label {
  name: string;
  color: string;
  icon?: string;
}