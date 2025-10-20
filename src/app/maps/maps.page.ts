import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;
  searchQuery: string = '';
  searchMarker: L.Marker | null = null;
  apiKey = '68d9fd7b6d9cf375889066eur5fcbbf'; // User's API Key

  // Variabel icon dengan path yang benar
  iconRetinaUrl = './assets/icon/marker-icon-2x.png';
  iconUrl = './assets/icon/marker-icon.png';
  shadowUrl = './assets/icon/marker-shadow.png';
  iconDefault = L.icon({
    iconRetinaUrl: this.iconRetinaUrl,
    iconUrl: this.iconUrl,
    shadowUrl: this.shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);
  private http = inject(HttpClient);

  constructor() { }

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        try {
          L.Marker.prototype.options.icon = this.iconDefault;
          this.map = L.map('map').setView([-7.7956, 110.3695], 13);

          // Define OSM layer
          var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          });

          // Define Esri World Imagery layer
          var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'ESRI'
          });

          // Add default layer to map
          osm.addTo(this.map);

          // Create base maps object for layer control
          var baseMaps = {
            "OpenStreetMap": osm,
            "Esri World Imagery": esri
          };

          // Add layer control to map
          L.control.layers(baseMaps).addTo(this.map);

          const yogyakartaMarker = L.marker([-7.7956, 110.3695], {
            icon: this.iconDefault
          }).addTo(this.map);
          (yogyakartaMarker as any).isDefault = true;
          yogyakartaMarker.bindPopup('Yogyakarta').openPopup();

          this.loadPoints();
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 100);
    }
  }

  async searchLocation(event: any) {
    const query = event.detail.value;
    if (!query || query.length < 3) {
      return;
    }

    const url = `https://geocode.maps.co/search?q=${encodeURIComponent(query)}&api_key=${this.apiKey}`;

    try {
      const results: any = await firstValueFrom(this.http.get(url));
      if (results && results.length > 0) {
        const result = results[0];
        const latLng = L.latLng(result.lat, result.lon);

        if (this.searchMarker) {
          this.map.removeLayer(this.searchMarker);
        }

        this.map.setView(latLng, 15);

        const popupContent = `
          <div class="popup-content">
            <div class="popup-title">${result.display_name}</div>
            <div class="popup-actions">
              <button id="add-search-result-btn" class="popup-btn" title="Tambahkan Titik Ini">
                <ion-icon name="add-circle-outline"></ion-icon>
              </button>
            </div>
          </div>
        `;

        this.searchMarker = L.marker(latLng, { icon: this.iconDefault }).addTo(this.map);
        this.searchMarker.bindPopup(popupContent);

        this.searchMarker.on('popupopen', () => {
          const btn = document.getElementById('add-search-result-btn');
          if (btn) {
            btn.onclick = () => {
              this.addPointFromSearch(result);
            };
          }
        });

        this.searchMarker.openPopup();
      }
    } catch (error) {
      console.error('Error during geocoding search:', error);
    }
  }

  async addPointFromSearch(searchResult: any) {
    try {
      const pointData = {
        name: searchResult.display_name,
        coordinates: `${searchResult.lat},${searchResult.lon}`
      };

      await this.dataService.savePoint(pointData);

      if (this.searchMarker) {
        this.map.closePopup(this.searchMarker.getPopup());
        this.map.removeLayer(this.searchMarker);
        this.searchMarker = null;
      }

      await this.loadPoints();
    } catch (error) {
      console.error('Error saving point from search:', error);
    }
  }

  async loadPoints() {
    try {
      const points: any = await this.dataService.getPoints();
      if (points) {
        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker && !(layer as any).isDefault) {
            this.map.removeLayer(layer);
          }
        });

        for (const key in points) {
          if (points.hasOwnProperty(key)) {
            const point = points[key];
            const coordinates = point.coordinates.split(',').map((c: string) => parseFloat(c));
            const marker = L.marker(coordinates as L.LatLngExpression, {
              icon: this.iconDefault
            }).addTo(this.map);

            const popupContent = `
              <div class="popup-content">
                <div class="popup-title">${point.name}</div>
                <div class="popup-actions">
                  <a href="#" class="popup-btn popup-btn-zoom" title="Zoom In">
                    <ion-icon name="search-outline"></ion-icon>
                  </a>
                  <a href="/editpoint/${key}" class="popup-btn popup-btn-edit" title="Edit">
                    <ion-icon name="create-outline"></ion-icon>
                  </a>
                  <a href="#" class="popup-btn popup-btn-delete" data-key="${key}" title="Delete">
                    <ion-icon name="trash-outline"></ion-icon>
                  </a>
                </div>
              </div>
            `;
            marker.bindPopup(popupContent);

            // Add event listener specifically for this marker's popup
            marker.on('popupopen', (e) => {
              const popupEl = e.popup.getElement();
              if (!popupEl) return;

              // Handle Delete Button
              const deleteBtn = popupEl.querySelector('.popup-btn-delete');
              if (deleteBtn) {
                (deleteBtn as HTMLElement).onclick = (event) => {
                  event.preventDefault();
                  const currentKey = (deleteBtn as HTMLElement).dataset['key'];
                  if (currentKey) {
                    this.presentDeleteConfirm(currentKey, marker.getLatLng());
                  }
                };
              }

              // Handle Zoom Button
              const zoomBtn = popupEl.querySelector('.popup-btn-zoom');
              if (zoomBtn) {
                (zoomBtn as HTMLElement).onclick = (event) => {
                  event.preventDefault();
                  this.map.flyTo(marker.getLatLng(), 17); // Zoom to level 17
                };
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading points:', error);
    }
  }

  async presentDeleteConfirm(key: string, latLng: L.LatLng | undefined) {
    const alert = await this.alertCtrl.create({
      header: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus titik ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          handler: () => {
            this.deletePoint(key, latLng);
          },
        },
      ],
    });
    await alert.present();
  }

  async deletePoint(key: string, latLng: L.LatLng | undefined) {
    try {
      await this.dataService.deletePoint(key);
      if (latLng) {
        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker && !(layer as any).isDefault) {
            if (layer.getLatLng().equals(latLng)) {
              this.map.removeLayer(layer);
            }
          }
        });
      }
      this.loadPoints();
    } catch (error) {
      console.error('Error deleting point:', error);
    }
  }
}
