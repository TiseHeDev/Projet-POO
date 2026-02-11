import { Injectable, signal, computed } from '@angular/core';
import { Transaction, CategoryStructure, Label } from '../models/transaction.model';

const DEFAULT_CATEGORY_STRUCTURE: CategoryStructure[] = [
  { name: 'Revenus', subcategories: ['Salaire', 'Prime', 'Freelance', 'Investissements', 'Autres revenus'] },
  { name: 'Logement', subcategories: ['Loyer', 'Électricité', 'Eau', 'Internet', 'Assurance habitation'] },
  { name: 'Nourriture', subcategories: ['Supermarché', 'Restaurant', 'Fast-food', 'Livraison'] },
  { name: 'Transport', subcategories: ['Essence', 'Transports en commun', 'Parking', 'Entretien véhicule', 'Assurance auto'] },
  { name: 'Loisirs', subcategories: ['Cinéma', 'Sport', 'Sorties', 'Abonnements streaming', 'Voyages'] },
  { name: 'Santé', subcategories: ['Médecin', 'Pharmacie', 'Mutuelle', 'Sport/Bien-être'] },
  { name: 'Shopping', subcategories: ['Vêtements', 'Électronique', 'Maison', 'Cadeaux'] },
  { name: 'Divers', subcategories: ['Impôts', 'Frais bancaires', 'Autres'] }
];

// Labels par défaut
const DEFAULT_LABELS: Label[] = [
  { name: 'Vacances', color: '#3b82f6', icon: '✈️' },
  { name: 'Anniversaire', color: '#ec4899', icon: '🎂' },
  { name: 'Noël', color: '#10b981', icon: '🎄' },
  { name: 'Mariage', color: '#8b5cf6', icon: '💍' },
  { name: 'Urgence', color: '#ef4444', icon: '🚨' }
];

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  public transactions = signal<Transaction[]>([]);
  public categoryStructure = signal<CategoryStructure[]>(DEFAULT_CATEGORY_STRUCTURE);
  public labels = signal<Label[]>(DEFAULT_LABELS);  // NOUVEAU

  public categories = computed(() => 
    this.categoryStructure().map(cat => cat.name).sort()
  );

  constructor() {}

  // ========== GESTION DES LABELS ==========

  addLabel(label: Label): void {
    const currentLabels = this.labels();
    const standardizedName = label.name.trim();
    
    if (currentLabels.some(l => l.name.toLowerCase() === standardizedName.toLowerCase())) {
      throw new Error(`Le label "${standardizedName}" existe déjà.`);
    }
    
    this.labels.update(labels => [...labels, { ...label, name: standardizedName }].sort((a, b) => a.name.localeCompare(b.name)));
  }

  deleteLabel(labelName: string): void {
    const hasTransactions = this.transactions().some(t => t.labels?.includes(labelName));
    if (hasTransactions) {
      throw new Error(`Impossible de supprimer "${labelName}" car des transactions l'utilisent.`);
    }
    
    this.labels.update(labels => labels.filter(l => l.name !== labelName));
  }

  updateLabel(oldName: string, newLabel: Label): void {
    this.labels.update(labels =>
      labels.map(l => l.name === oldName ? newLabel : l)
    );

    if (oldName !== newLabel.name) {
      this.transactions.update(trans =>
        trans.map(t => ({
          ...t,
          labels: t.labels?.map(label => label === oldName ? newLabel.name : label)
        }))
      );
    }
  }

  getLabelByName(name: string): Label | undefined {
    return this.labels().find(l => l.name === name);
  }

  getTransactionsByLabel(labelName: string): Transaction[] {
    return this.transactions().filter(t => t.labels?.includes(labelName));
  }

  getTotalByLabel(labelName: string): { expenses: number; revenues: number; balance: number } {
    const transactions = this.getTransactionsByLabel(labelName);
    const expenses = transactions
      .filter(t => t.type === 'Dépense')
      .reduce((sum, t) => sum + t.amount, 0);
    const revenues = transactions
      .filter(t => t.type === 'Revenu')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { expenses, revenues, balance: revenues - expenses };
  }

  // ========== GESTION DES CATÉGORIES ==========

  addCategory(categoryName: string, subcategories: string[] = []): void {
    const currentStructure = this.categoryStructure();
    const standardizedName = categoryName.trim();
    
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
    const hasTransactions = this.transactions().some(t => t.category === categoryName);
    if (hasTransactions) {
      throw new Error(`Impossible de supprimer "${categoryName}" car des transactions l'utilisent.`);
    }
    
    this.categoryStructure.update(cats => cats.filter(cat => cat.name !== categoryName));
  }

  getSubcategories(categoryName: string): string[] {
    const category = this.categoryStructure().find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  }

  addSubcategory(categoryName: string, subcategoryName: string): void {
    const standardizedSubcat = subcategoryName.trim();
    
    this.categoryStructure.update(cats => 
      cats.map(cat => {
        if (cat.name === categoryName) {
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
    
    if (this.categoryStructure().some(cat => cat.name.toLowerCase() === standardizedNewName.toLowerCase() && cat.name !== oldName)) {
      throw new Error(`La catégorie "${standardizedNewName}" existe déjà.`);
    }

    this.categoryStructure.update(cats =>
      cats.map(cat => cat.name === oldName ? { ...cat, name: standardizedNewName } : cat)
    );

    this.transactions.update(trans =>
      trans.map(t => t.category === oldName ? { ...t, category: standardizedNewName } : t)
    );
  }

  getAllCategories(): string[] {
    return this.categories();
  }
  
  // ========== GESTION DES TRANSACTIONS ==========

  addTransaction(transaction: Omit<Transaction, 'id'>): void {
    const currentTransactions = this.transactions();
    const newId = currentTransactions.length > 0
      ? Math.max(...currentTransactions.map(t => t.id)) + 1
      : 1;

    const newTransaction: Transaction = {
      ...transaction,
      id: newId,
      subcategory: transaction.subcategory || undefined,
      labels: transaction.labels || []  // NOUVEAU
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

  // ========== IMPORT / EXPORT ==========

  importTransactions(importedData: any[]): void {
    const parsedTransactions = importedData.map(t => ({
      ...t,
      date: new Date(t.date),
      subcategory: t.subcategory || undefined,
      labels: t.labels || []  // NOUVEAU
    }));
    
    const updatedTransactions = parsedTransactions.map((t, index) => ({
      ...t,
      id: index + 1
    }));

    // Extraction des catégories
    const categoryMap = new Map<string, Set<string>>();
    updatedTransactions.forEach(t => {
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, new Set());
      }
      if (t.subcategory) {
        categoryMap.get(t.category)!.add(t.subcategory);
      }
    });

    // NOUVEAU: Extraction des labels
    const labelSet = new Set<string>();
    updatedTransactions.forEach(t => {
      if (t.labels) {
        t.labels.forEach((label: string) => labelSet.add(label));
      }
    });

    // Ajouter les nouveaux labels avec des couleurs par défaut
    const currentLabels = this.labels();
    const newLabels: Label[] = [];
    const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
    let colorIndex = 0;

    labelSet.forEach(labelName => {
      if (!currentLabels.some(l => l.name === labelName)) {
        newLabels.push({
          name: labelName,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    if (newLabels.length > 0) {
      this.labels.update(labels => [...labels, ...newLabels].sort((a, b) => a.name.localeCompare(b.name)));
    }

    // Mise à jour de la structure des catégories
    const currentStructure = this.categoryStructure();
    const newStructure = [...currentStructure];

    categoryMap.forEach((subcats, catName) => {
      const existingCat = newStructure.find(cat => cat.name === catName);
      
      if (existingCat) {
        const newSubcats = Array.from(subcats).filter(
          sub => !existingCat.subcategories.includes(sub)
        );
        if (newSubcats.length > 0) {
          existingCat.subcategories = [...existingCat.subcategories, ...newSubcats].sort();
        }
      } else {
        newStructure.push({
          name: catName,
          subcategories: Array.from(subcats).length > 0 
            ? Array.from(subcats).sort() 
            : ['Général']
        });
      }
    });

    this.categoryStructure.set(newStructure.sort((a, b) => a.name.localeCompare(b.name)));
    this.transactions.set(updatedTransactions);
  }
  
  getAllMethods(): string[] {
    const methods = this.transactions().map(t => t.method);
    return [...new Set(methods)].sort();
  }
}