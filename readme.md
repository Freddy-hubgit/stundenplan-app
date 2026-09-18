# Stundenplan 11BGUTI

Der Angular-Stundenplan aus dem GitHub-Repo läuft jetzt als **Windows-11-App** und als **Android-APK**.

Fertige Dateien liegen im Ordner `release/`:

- `Stundenplan 11BGUTI Setup 1.0.0.exe` — Windows-Installer
- `Stundenplan 11BGUTI 1.0.0.exe` — portable Windows-App (kein Installer nötig)
- `Stundenplan-11BGUTI.apk` — Android-App (Debug-APK, auf dem Handy installierbar)

## Windows

Installer doppelklicken oder die portable `.exe` starten.

Neu bauen:

```powershell
npm install --legacy-peer-deps
npm run dist:win
```

## Android

Die APK aufs Handy kopieren und öffnen. Unter **Einstellungen → Sicherheit** die Installation aus unbekannten Quellen erlauben.

Neu bauen (Android SDK + JDK 17 nötig):

```powershell
npm install --legacy-peer-deps
npm run cap:sync
```

Danach in Android Studio den Ordner `android` öffnen, oder:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Die APK liegt dann unter `android/app/build/outputs/apk/debug/app-debug.apk`.

## Updates

Windows- und Android-App laden bei Internet die **aktuelle Webversion** von GitHub Pages:

`https://Freddy-hubgit.github.io/stundenplan-11bguti/`

Sobald im Repo `Freddy-hubgit/stundenplan-11bguti` ein neuer Commit auf `main` landet (und Pages neu gebaut wurde), ziehen die Apps das Update:

- beim Start
- wenn die App wieder in den Vordergrund kommt (Android)
- automatisch etwa alle 5 Minuten
- manuell unter **Einstellungen → Auf Updates prüfen**

Ohne Internet bleibt die zuletzt mitgelieferte Version in der App.

## Web

```powershell
npm start
```

Browser: `http://localhost:4200`
