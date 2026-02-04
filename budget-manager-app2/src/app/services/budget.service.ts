import { Injectable, signal, computed } from '@angular/core';
import { Transaction, CategoryStructure } from '../models/transaction.model';

// Structure par défaut avec catégories et sous-catégories
const DEFAULT_CATEGORY_STRUCTURE: CategoryStructure[] = [
  {
    name: 'Revenus',
    subcategories: ['Salaire', 'Prime', 'Freelance', 'Investissements', 'Autres revenus']
  },
  {
    name: 'Logement',
    subcategories: ['Loyer', 'Électricité', 'Eau', 'Internet', 'Assurance habitation']
  },
  {
    name: 'Nourriture',
    subcategories: ['Supermarché', 'Restaurant', 'Fast-food', 'Livraison']
  },
  {
    name: 'Transport',
    subcategories: ['Essence', 'Transports en commun', 'Parking', 'Entretien véhicule', 'Assurance auto']
  },
  {
    name: 'Loisirs',
    subcategories: ['Cinéma', 'Sport', 'Sorties', 'Abonnements streaming', 'Voyages']
  },
  {
    name: 'Santé',
    subcategories: ['Médecin', 'Pharmacie', 'Mutuelle', 'Sport/Bien-être']
  },
  {
    name: 'Shopping',
    subcategories: ['Vêtements', 'Électronique', 'Maison', 'Cadeaux']
  },
  {
    name: 'Divers',
    subcategories: ['Impôts', 'Frais bancaires', 'Autres']
  }
];

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  // Signal pour les transactions
  public transactions = signal<Transaction[]>([]);
  
  // Signal pour la structure des catégories (avec sous-catégories)
  public categoryStructure = signal<CategoryStructure[]>(DEFAULT_CATEGORY_STRUCTURE);

  // Computed: Liste plate des catégories principales
  public categories = computed(() => 
    this.categoryStructure().map(cat => cat.name).sort()
  );

  constructor() {}

  // --- GESTION DES CATÉGORIES PRINCIPALES ---

  addCategory(categoryName: string, subcategories: string[] = []): void {
    const currentStructure = this.categoryStructure();
    const standardizedName = categoryName.trim();
    
    // Vérification si la catégorie existe déjà
    if (currentStructure.some(cat => cat.name.toLowerCase() === standardizedName.toLowerCase())) {
      throw new Error(`La catégorie "${standardizedName}" existe déjà.`);
    }
    
    const newCategory: CategoryStructure = {
      name: standardizedName,
      subcategories: subcategories.length > 0 ? subcategories : ['Général']
    };
    
    this.categoryStructure.update(cats => [...cats, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  }
  
  deleteCategory(categoryName: string): void {
    // Vérifier si des transactions utilisent cette catégorie
    const hasTransactions = this.transactions().some(t => t.category === categoryName);
    if (hasTransactions) {
      throw new Error(`Impossible de supprimer "${categoryName}" car des transactions l'utilisent.`);
    }
    
    this.categoryStructure.update(cats => cats.filter(cat => cat.name !== categoryName));
  }

  // --- GESTION DES SOUS-CATÉGORIES ---

  getSubcategories(categoryName: string): string[] {
    const category = this.categoryStructure().find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  }

  addSubcategory(categoryName: string, subcategoryName: string): void {
    const standardizedSubcat = subcategoryName.trim();
    
    this.categoryStructure.update(cats => 
      cats.map(cat => {
        if (cat.name === categoryName) {
          // Vérifier si la sous-catégorie existe déjà
          if (cat.subcategories.some(sub => sub.toLowerCase() === standardizedSubcat.toLowerCase())) {
            throw new Error(`La sous-catégorie "${standardizedSubcat}" existe déjà dans "${categoryName}".`);
          }
          return {
            ...cat,
            subcategories: [...cat.subcategories, standardizedSubcat].sort()
          };
        }
        return cat;
      })
    );
  }

  deleteSubcategory(categoryName: string, subcategoryName: string): void {
    // Vérifier si des transactions utilisent cette sous-catégorie
    const hasTransactions = this.transactions().some(
      t => t.category === categoryName && t.subcategory === subcategoryName
    );
    
    if (hasTransactions) {
      throw new Error(`Impossible de supprimer "${subcategoryName}" car des transactions l'utilisent.`);
    }

    this.categoryStructure.update(cats =>
      cats.map(cat => {
        if (cat.name === categoryName) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter(sub => sub !== subcategoryName)
          };
        }
        return cat;
      })
    );
  }

  updateCategoryName(oldName: string, newName: string): void {
    const standardizedNewName = newName.trim();
    
    // Vérifier si le nouveau nom existe déjà
    if (this.categoryStructure().some(cat => cat.name.toLowerCase() === standardizedNewName.toLowerCase() && cat.name !== oldName)) {
      throw new Error(`La catégorie "${standardizedNewName}" existe déjà.`);
    }

    // Mettre à jour le nom dans la structure
    this.categoryStructure.update(cats =>
      cats.map(cat => cat.name === oldName ? { ...cat, name: standardizedNewName } : cat)
    );

    // Mettre à jour toutes les transactions qui utilisent cette catégorie
    this.transactions.update(trans =>
      trans.map(t => t.category === oldName ? { ...t, category: standardizedNewName } : t)
    );
  }

  getAllCategories(): string[] {
    return this.categories();
  }
  
  // --- GESTION DES TRANSACTIONS ---

  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    const currentTransactions = this.transactions();
    const newId = currentTransactions.length > 0
      ? Math.max(...currentTransactions.map(t => t.id)) + 1
      : 1;

    const newTransaction: Transaction = {
      ...transaction,
      id: newId,
      subcategory: transaction.subcategory || undefined
    };

    this.transactions.update(curr => [...curr, newTransaction]);
  }

  updateTransaction(updatedTransaction: Transaction): void {
    this.transactions.update(curr => 
      curr.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  }

  deleteTransaction(id: number): void {
    this.transactions.update(curr => curr.filter(t => t.id !== id));
  }

  getAllTransactions(): Transaction[] {
    return this.transactions();
  }

  // --- IMPORT / EXPORT ---

  importTransactions(importedData: any[]): void {
    // 1. Parsing des dates
    const parsedTransactions = importedData.map(t => ({
      ...t,
      date: new Date(t.date),
      subcategory: t.subcategory || undefined
    }));
    
    // 2. Réattribution des IDs
    const updatedTransactions = parsedTransactions.map((t, index) => ({
      ...t,
      id: index + 1
    }));

    // 3. Extraction des nouvelles catégories et sous-catégories
    const categoryMap = new Map<string, Set<string>>();
    
    updatedTransactions.forEach(t => {
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, new Set());
      }
      if (t.subcategory) {
        categoryMap.get(t.category)!.add(t.subcategory);
      }
    });

    // 4. Mise à jour de la structure des catégories
    const currentStructure = this.categoryStructure();
    const newStructure = [...currentStructure];

    categoryMap.forEach((subcats, catName) => {
      const existingCat = newStructure.find(cat => cat.name === catName);
      
      if (existingCat) {
        // Ajouter les nouvelles sous-catégories
        const newSubcats = Array.from(subcats).filter(
          sub => !existingCat.subcategories.includes(sub)
        );
        if (newSubcats.length > 0) {
          existingCat.subcategories = [...existingCat.subcategories, ...newSubcats].sort();
        }
      } else {
        // Créer une nouvelle catégorie
        newStructure.push({
          name: catName,
          subcategories: Array.from(subcats).length > 0 
            ? Array.from(subcats).sort() 
            : ['Général']
        });
      }
    });

    this.categoryStructure.set(newStructure.sort((a, b) => a.name.localeCompare(b.name)));
    
    // 5. Remplacement total des transactions
    this.transactions.set(updatedTransactions);
  }
  
  getAllMethods(): string[] {
    const methods = this.transactions().map(t => t.method);
    return [...new Set(methods)].sort();
  }
}