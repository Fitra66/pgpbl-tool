import { Component, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  // field untuk ngModel
  email = '';
  password = '';
  confirmPassword = '';
  // state UI yang dipakai di template
  showErrors = false;
  isLoading = false;
  // toast state
  toastOpen = false;
  toastMessage = '';

  // Inject services
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastOpen = true;
  }

  cancel() {
    this.navCtrl.navigateBack('/login');
  }

  async register() {
    // Validasi awal: cek apakah semua field terisi
    if (!this.email || !this.password || !this.confirmPassword) {
      this.showToast('Harap isi semua field yang diperlukan.');
      return;
    }

    // Validasi password dan konfirmasi password
    if (this.password !== this.confirmPassword) {
      this.showToast('Kata sandi tidak cocok.');
      return;
    }

    this.isLoading = true;

    try {
      // Panggil service register
      await this.authService.register(this.email, this.password);
      // Jika berhasil, navigasi kembali ke login
      this.navCtrl.navigateBack('/login');
    } catch (error: unknown) {
      let errorMessage = 'Pendaftaran gagal. Silakan coba lagi.';

      // Periksa apakah error adalah FirebaseError
      if (error instanceof FirebaseError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Tampilkan alert error
      const alert = await this.alertCtrl.create({
        header: 'Pendaftaran Gagal',
        message: errorMessage,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.isLoading = false;
    }
  }
}
