// src/app/models/transaction.model.ts

export interface Transaction {
  id: number;
  date: Date;
  category: string;          // Catégorie principale (ex: "Nourriture")
  subcategory?: string;       // Sous-catégorie (ex: "Restaurant", "Supermarché")
  type: 'Revenu' | 'Dépense'; 
  method: string; 
  amount: number;
  description?: string; 
}

// Interface pour la structure hiérarchique des catégories
export interface CategoryStructure {
  name: string;
  subcategories: string[];
}