import { Injectable } from '@angular/core';
// Tambahkan import berikut di bagian atas
import { ref, push, onValue, remove, get, update } from 'firebase/database';
import { database } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Tambahkan method savePoint di dalam class
  savePoint(point: { name: string, coordinates: string }) {
    const pointsRef = ref(database, 'points');
    return push(pointsRef, point);
  }

  // Tambahkan method getPoints() untuk mengambil data points
  getPoints() {
    const pointsRef = ref(database, 'points');
    return new Promise((resolve, reject) => {
      onValue(pointsRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data);
      }, (error) => {
        reject(error);
      });
    });
  }

  // Tambahkan method deletePoint() untuk menghapus data point
  deletePoint(key: string) {
    const pointRef = ref(database, `points/${key}`);
    return remove(pointRef);
  }

  // Tambahkan method getPoint() untuk mengambil data point berdasarkan key
  getPoint(key: string) {
    const pointRef = ref(database, `points/${key}`);
    return new Promise((resolve, reject) => {
      get(pointRef).then((snapshot) => {
        const data = snapshot.val();
        resolve(data);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  // Tambahkan method updatePoint() untuk memperbarui data point
  updatePoint(key: string, point: { name: string, coordinates: string }) {
    const pointRef = ref(database, `points/${key}`);
    return update(pointRef, point);
  }
}
