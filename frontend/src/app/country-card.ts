import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-country-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './country-card.html',
  styleUrl: './country-card.css'
})
export class CountryCardComponent {
  @Input({ required: true }) country!: { slug: string; status: string };
}
