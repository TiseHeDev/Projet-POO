// src/app/app.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // [IMPORTANT] Assurez-vous que cette ligne n'existe PAS : standalone: true,
  // [IMPORTANT] Assurez-vous que l'array imports: [] n'existe PAS
})
export class AppComponent { // 👈 DOIT AVOIR 'export'
  title = 'GestionnaireBudget';
}