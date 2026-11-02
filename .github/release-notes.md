# Windows-Version 1.1.0

- Hausaufgaben-Erinnerungen direkt in der App aktivieren, ohne Web-Push-Dienst oder Browser-Registrierung.
- Optionale Windows-Benachrichtigungen für neue Krankmeldungen und Unterrichtsänderungen.
- Bei aktivierten Benachrichtigungen bleibt die App beim Schließen des Fensters im Infobereich aktiv. Über das Symbol kann sie geöffnet oder vollständig beendet werden.
- Erinnerungszeit und Aktivierung werden pro Konto und Installation gespeichert. Abmelden bzw. Kontowechsel stoppt die Zustellung für das vorherige Konto.
- Klick auf eine Benachrichtigung öffnet den passenden Bereich der App.
- Die bestehende Updateprüfung und Offline-Wiederherstellung bleiben erhalten.

## Einmaliges App-Update

Für native Windows-Benachrichtigungen bitte die Datei mit **Setup** im Namen installieren; sie richtet auch den Windows-Startmenüeintrag ein. Die andere EXE ist portabel, deren Benachrichtigungsregistrierung vom System abhängt. Die alte Version zuerst vollständig schließen. Diese native Erweiterung erfordert den neuen Installer bzw. die neue portable EXE; ein reines Webseiten-Update genügt nicht.

Danach anmelden und unter **Hausaufgaben → Benachrichtigungen aktivieren** bzw. **Benachrichtigungen → Push für Meldungen aktivieren** einschalten. Bei der Aktivierung zeigt Windows eine Bestätigungsmeldung.

Für die Zustellung müssen die App im Hintergrund laufen, der PC eingeschaltet und Internet verfügbar sein. Bei vollständig beendeter App erfolgt keine Zustellung. Windows-Fokusmodus und Benachrichtigungseinstellungen können die Anzeige unterdrücken. Es werden keine neuen Supabase-Secrets benötigt.

Die EXE-Dateien sind nicht mit einem Windows-Code-Signing-Zertifikat signiert. Automatisierte Tests verwenden simulierte Windows-Benachrichtigungen; eine Prüfung der tatsächlichen Zustellung auf einem Windows-Gerät ist weiterhin erforderlich.
