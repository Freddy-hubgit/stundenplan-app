# Windows-Version 1.2.1

Programmupdates direkt in der installierten Windows-App: Unter Einstellungen → App-Update auf Updates prüfen, das Programmupdate herunterladen und anschließend „Jetzt installieren und neu starten“ wählen. Vorher offene Änderungen speichern. Die Installation startet erst nach zusätzlicher Bestätigung im Windows-Fenster.

Downloads werden über das feste GitHub-Repository bezogen und anhand der veröffentlichten SHA512-Prüfsumme überprüft. Bei einem Fehler kann der Download erneut versucht werden. Ein fertiger Download bleibt bis zum Beenden der App zur Installation bereit. Webupdates werden weiterhin getrennt geprüft.

Ältere Apps benötigen einmalig diesen Setup-Installer. Die portable EXE wird weiterhin manuell ersetzt. Es sind keine Supabase-Änderungen nötig.

Die Windows-Dateien sind weiterhin nicht mit einem Code-Signing-Zertifikat signiert. Automatisierte Tests prüfen den Updateablauf mit simuliertem Electron; der tatsächliche Installerstart muss zusätzlich auf Windows geprüft werden. Bereits vorhandene native Erinnerungen und Hintergrundbetrieb bleiben erhalten.
