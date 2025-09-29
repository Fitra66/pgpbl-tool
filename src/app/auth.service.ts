import { Injectable } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Proses login
  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Proses registrasi user baru
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Proses logout
  logout() {
    return signOut(auth);
  }
}
