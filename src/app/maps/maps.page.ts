import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
// Tambahkan import DataService
import { DataService } from '../data.service';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  map!: L.Map;

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

  // Tambahkan variabel dataService
  private dataService = inject(DataService);

  constructor() { }

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        try {
          // Set icon default untuk semua marker SEBELUM membuat peta
          L.Marker.prototype.options.icon = this.iconDefault;

          this.map = L.map('map').setView([-7.7956, 110.3695], 13);
          var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          });
          osm.addTo(this.map);

          // Tambahkan marker dengan popup dan berikan custom property
          const yogyakartaMarker = L.marker([-7.7956, 110.3695], {
            icon: this.iconDefault
          }).addTo(this.map);

          // Tambahkan custom property untuk identifikasi
          (yogyakartaMarker as any).isDefault = true;

          yogyakartaMarker.bindPopup('Yogyakarta')
            .openPopup();

          // Debug: cek apakah icon terbuat dengan benar
          console.log('Icon URL:', this.iconDefault.options.iconUrl);
          console.log('Icon Retina URL:', this.iconDefault.options.iconRetinaUrl);

          // Tambahkan pemanggilan loadPoints()
          this.loadPoints();
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 100); // Tambahkan delay 100ms untuk memastikan DOM siap
    }
  }

  // Tambahkan function loadPoints()
  async loadPoints() {
    try {
      const points: any = await this.dataService.getPoints();
      if (points) {
        // Hapus semua marker kecuali marker default
        this.map.eachLayer((layer) => {
          if (layer instanceof L.Marker && !(layer as any).isDefault) {
            this.map.removeLayer(layer);
          }
        });

        for (const key in points) {
          if (points.hasOwnProperty(key)) {
            const point = points[key];
            const coordinates = point.coordinates.split(',').map((c: string) => parseFloat(c));

            // Buat marker dengan ikon default secara eksplisit
            const marker = L.marker(coordinates as L.LatLngExpression, {
              icon: this.iconDefault
            }).addTo(this.map);

            // Buat popup content dengan HTML string
            const popupContent = `
              <div class="popup-content">
                <div class="popup-title">${point.name}</div>
                <div class="popup-actions">
                  <a href="/editpoint/${key}" class="popup-btn popup-btn-edit">Edit</a>
                  <a href="#" class="popup-btn popup-btn-delete" data-key="${key}">Delete</a>
                </div>
              </div>
            `;

            // Bind popup ke marker
            marker.bindPopup(popupContent);
          }
        }

        // Tambahkan event listener untuk popupopen
        this.map.on('popupopen', (e: any) => {
          const popup = e.popup;
          const popupElement = popup.getElement();

          if (popupElement) {
            // Tambahkan event listener untuk link delete
            const deleteLink = popupElement.querySelector('.popup-btn-delete');
            if (deleteLink) {
              deleteLink.addEventListener('click', (event: Event) => {
                event.preventDefault();
                const key = (event.target as HTMLElement).dataset['key'];
                if (key) {
                  this.deletePoint(key, popup.getLatLng());
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading points:', error);
    }
  }

  // Tambahkan function deletePoint()
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
      // Refresh points setelah delete
      this.loadPoints();
    } catch (error) {
      console.error('Error deleting point:', error);
    }
  }
}
