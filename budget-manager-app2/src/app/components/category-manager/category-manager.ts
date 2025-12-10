// src/app/components/category-manager/category-manager.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.css'
})
export class CategoryManager implements OnInit {
  categories$!: Observable<string[]>;
  
  newCategory: string = '';
  errorMessage: string | null = null;
  
  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    this.categories$ = this.budgetService.categories$;
  }

  addCategory(): void {
    if (!this.newCategory.trim()) {
      this.errorMessage = "La catégorie ne peut pas être vide.";
      return;
    }
    
    const categoryName = this.newCategory.trim();
    
    try {
      this.budgetService.addCategory(categoryName);
      this.newCategory = '';
      this.errorMessage = null;
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  deleteCategory(category: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category}" ? Cela ne supprimera PAS les transactions existantes qui l'utilisent.`)) {
      try {
        this.budgetService.deleteCategory(category);
      } catch (error: any) {
        this.errorMessage = error.message;
      }
    }
  }
}