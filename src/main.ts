import './polyfills';

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { UpdateService } from './app/update.service';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule).then(ref => {
  if (Capacitor.isNativePlatform()) {
    const updates = ref.injector.get(UpdateService);
    const refresh = async () => { if (await updates.check()) await updates.apply(); };
    void refresh();
    setInterval(() => { void refresh(); }, 5 * 60 * 1000);
    void App.addListener('appStateChange', state => { if (state.isActive) void refresh(); });
  }
  // Ensure Angular destroys itself on hot reloads.
  if (window['ngRef']) {
    window['ngRef'].destroy();
  }
  window['ngRef'] = ref;

  // Otherwise, log the boot error
}).catch(err => console.error(err));