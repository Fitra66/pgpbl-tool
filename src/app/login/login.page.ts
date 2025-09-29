import { Component, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  // field untuk ngModel
  email = '';
  password = '';
  // state UI yang dipakai di template
  showErrors = false;
  rememberMe = true;
  isLoading = false;
  // toast state
  toastOpen = false;
  toastMessage = '';

  // Inject services
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);

  goToRegister() {
  this.navCtrl.navigateForward('/register');
}

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastOpen = true;
  }

  async login() {
    // Validasi awal: cek apakah email dan password terisi
    if (!this.email || !this.password) {
      this.showToast('Please fill all required fields.');
      return;
    }

    this.isLoading = true;

    try {
      // Panggil service login
      await this.authService.login(this.email, this.password);
      // Jika berhasil, navigasi ke tabs
      this.navCtrl.navigateRoot('/tabs');
    } catch (error: any) {
      // Tampilkan alert error
      const alert = await this.alertCtrl.create({
        header: 'Login Failed',
        message: error.message,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.isLoading = false;
    }
  }
}
