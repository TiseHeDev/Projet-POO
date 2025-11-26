// src/app/models/transaction.model.ts

/**
 * ITransaction : Contrat de données pour chaque transaction.
 */
export interface ITransaction {
  id: number;
  date: Date;
  montant: number; // Négatif pour Dépense, Positif pour Revenu
  description: string;
  categorie: string; 
  typePaiement: string; 
}

/**
 * IBudgetSummary : Contrat de données pour le résumé budgétaire.
 */
export interface IBudgetSummary {
  solde: number;
  revenusTotal: number;
  depensesTotal: number;
  estDansLeVert: boolean;
}

