import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideIonicAngular(), // Required for Ionic standalone components
        provideRouter(routes),
        // Enables the modern Fetch API (better for mobile/Capacitor)
        provideHttpClient(withFetch()),
    ],
};