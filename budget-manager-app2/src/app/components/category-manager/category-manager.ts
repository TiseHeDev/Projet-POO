import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.css'
})
export class CategoryManager {
  // Injection publique pour le template
  public budgetService = inject(BudgetService);
  
  newCategory: string = '';
  newSubcategory: string = '';
  selectedCategory: string = '';
  errorMessage: string | null = null;
  
  // Signal pour savoir quelle catégorie est en cours d'édition de sous-catégories
  editingSubcategoriesFor = signal<string | null>(null);
  
  addCategory(): void {
    if (!this.newCategory.trim()) {
      this.errorMessage = "La catégorie ne peut pas être vide.";
      return;
    }
    
    try {
      this.budgetService.addCategory(this.newCategory.trim(), ['Général']);
      this.newCategory = '';
      this.errorMessage = null;
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  deleteCategory(category: string): void {
    if (confirm(`Supprimer la catégorie "${category}" et toutes ses sous-catégories ?`)) {
      try {
        this.budgetService.deleteCategory(category);
        this.errorMessage = null;
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }

  toggleSubcategoryEditor(categoryName: string): void {
    const current = this.editingSubcategoriesFor();
    if (current === categoryName) {
      this.editingSubcategoriesFor.set(null);
      this.selectedCategory = '';
      this.newSubcategory = '';
    } else {
      this.editingSubcategoriesFor.set(categoryName);
      this.selectedCategory = categoryName;
      this.newSubcategory = '';
    }
  }

  addSubcategory(): void {
    if (!this.selectedCategory) {
      this.errorMessage = "Veuillez sélectionner une catégorie.";
      return;
    }
    
    if (!this.newSubcategory.trim()) {
      this.errorMessage = "La sous-catégorie ne peut pas être vide.";
      return;
    }
    
    try {
      this.budgetService.addSubcategory(this.selectedCategory, this.newSubcategory.trim());
      this.newSubcategory = '';
      this.errorMessage = null;
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  deleteSubcategory(categoryName: string, subcategoryName: string): void {
    if (confirm(`Supprimer la sous-catégorie "${subcategoryName}" ?`)) {
      try {
        this.budgetService.deleteSubcategory(categoryName, subcategoryName);
        this.errorMessage = null;
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }

  getSubcategories(categoryName: string): string[] {
    return this.budgetService.getSubcategories(categoryName);
  }
}