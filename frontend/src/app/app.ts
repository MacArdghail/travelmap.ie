import { Component, ElementRef, ViewChild, PLATFORM_ID, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from './translate.pipe';
import { TranslateService } from './translate.service';
import { MapService } from './map.service';
import { groupByContinent } from './continent.utils';
import { CountryCardComponent } from './country-card';

interface CountryData {
  [key: string]: string
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, TranslatePipe, FormsModule, CountryCardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild('map') mapContainer!: ElementRef;
  
  protected title = 'Irish Travel Advice Map';
  countries: { slug: string; status: string }[] = []
  filteredCountries: { slug: string; status: string }[] = []
  groupedCountries: { [continent: string]: { slug: string; status: string }[] } = {};
  continents: string[] = [];
  searchQuery: string = '';
  selectedLevel: string = 'all';
  groupByContinent: boolean = false;
  lastUpdated: string = '';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private mapService: MapService,
    private translateService: TranslateService
  ) {
    // Initialize Vercel Analytics
    if (isPlatformBrowser(this.platformId)) {
      import('@vercel/analytics').then(({ inject }) => inject());
    }
  }

  ngOnInit() {
    this.http.get<{ lastUpdated: string }>('/metadata.json').subscribe((metadata) => {
      const date = new Date(metadata.lastUpdated);
      this.lastUpdated = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).toUpperCase();
    })

    this.http.get<CountryData>('/travel_advice.json').subscribe((statusData) => {
      this.countries = Object.entries(statusData).map(
        ([slug, status]) => ({
          slug,
          status
        })
      ).sort((a, b) => a.slug.localeCompare(b.slug));
      
      this.filteredCountries = [...this.countries];
      
      // Add advisories to map if it's already initialized
      if (this.mapContainer) {
        this.mapService.addCountryAdvisories(this.countries);
      }
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.mapService.initializeLeaflet();
      this.mapService.createMap(this.mapContainer.nativeElement);
      
      // Add advisories if countries data is already loaded
      if (this.countries.length > 0) {
        this.mapService.addCountryAdvisories(this.countries);
      }
    }
  }

  openDFAWebsite() {
    window.open('https://www.ireland.ie/en/dfa/overseas-travel/advice/', '_blank');
  }

  filterCountries() {
    const query = this.searchQuery.toLowerCase().trim();
    
    let filtered = [...this.countries];

    // Filter by level
    if (this.selectedLevel !== 'all') {
      filtered = filtered.filter(country => country.status === this.selectedLevel);
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter(country => {
        const translatedName = this.translateService.translate(`countries.${country.slug}`).toLowerCase();
        return translatedName.includes(query) || country.slug.includes(query);
      });
    }

    this.filteredCountries = filtered;
    
    // Update grouped view
    if (this.groupByContinent) {
      this.updateGroupedCountries();
    }
  }

  updateGroupedCountries() {
    this.groupedCountries = groupByContinent(this.filteredCountries);
    this.continents = Object.keys(this.groupedCountries).sort();
  }

  toggleGrouping() {
    this.groupByContinent = !this.groupByContinent;
    if (this.groupByContinent) {
      this.updateGroupedCountries();
    }
  }
}
