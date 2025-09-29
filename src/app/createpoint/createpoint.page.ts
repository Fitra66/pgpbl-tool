import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
// Tambahkan import Leaflet di bagian atas
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {
  name = '';
  coordinates = '';

  // Tambahkan variabel map
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

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);

  constructor() { }

  ngOnInit() {
    // Tambahkan script untuk menampilkan peta Leaflet
    setTimeout(() => {
      try {
        // Set icon default untuk semua marker SEBELUM membuat peta
        L.Marker.prototype.options.icon = this.iconDefault;

        this.map = L.map('mapcreate').setView([-7.7956, 110.3695], 13);

        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        // Esri World Imagery
        var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'ESRI'
        });

        osm.addTo(this.map);

        // Layer control
        var baseMaps = {
          "OpenStreetMap": osm,
          "Esri World Imagery": esri
        };

        L.control.layers(baseMaps).addTo(this.map);

        var tooltip = 'Drag the marker or move the map<br>to change the coordinates<br>of the location';
        // Buat marker dengan ikon default secara eksplisit
        var marker = L.marker([-7.7956, 110.3695], {
          draggable: true,
          icon: this.iconDefault
        });
        marker.addTo(this.map);
        marker.bindPopup(tooltip);
        marker.openPopup();

        marker.on('dragend', (e) => {
          let latlng = e.target.getLatLng();
          let lat = latlng.lat.toFixed(9);
          let lng = latlng.lng.toFixed(9);
          // push lat lng to coordinates input
          this.coordinates = lat + ',' + lng;
          console.log(this.coordinates);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100); // Tambahkan delay 100ms untuk memastikan DOM siap
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        await this.dataService.savePoint({ name: this.name, coordinates: this.coordinates });
        // back to route maps
        this.navCtrl.back();
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }
}
