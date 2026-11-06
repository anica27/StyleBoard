# StyleBoard 👗✨

**StyleBoard** ist eine minimalistische, hochperformante mobile Outfit-Moodboard-Applikation für **iOS** und **Android** (sowie Web), inspiriert von Canva und Pinterest. Sie ermöglicht das freie Arrangieren, Skalieren, Drehen und Überlagern von Kleidungsstücken, Screenshots und Fotos auf einer interaktiven Arbeitsfläche mit dezentem Punktraster.

> [!IMPORTANT]
> **100% Offline & Lokal:** Keine KI-Hintergrundentfernung oder Cloud-Abhängigkeiten. Alle Bild- und Boardoperationen finden rein lokal auf dem Gerät statt.

---

## 🛠 Tech-Stack & Architektur

- **Framework:** React Native mit Expo SDK 58 & Expo Router (`app/`)
- **Sprache:** TypeScript (100% typensicher)
- **Gesten & Animationen:** `react-native-gesture-handler` & `react-native-reanimated` (60fps Multi-Touch-Gesten)
- **Lokale Datenhaltung:** `expo-file-system` (persistente Bilddateien) & `@react-native-async-storage/async-storage` (Board- und Kleiderschrank-Metadaten)
- **Bildzugriff:** `expo-image-picker` (Kamera und Mediathek)
- **Clipboard-Import:** `expo-clipboard` (für direkt kopierte Screenshots aus Safari, Pinterest oder Instagram)
- **Bildmanipulation:** `expo-image-manipulator` (manuelles Rechteck-Zuschneidetool)
- **Export:** `react-native-view-shot`, `expo-media-library` & `expo-sharing`
- **Haptik:** `expo-haptics`
- **Icons & Styling:** Lucide Icons (`lucide-react-native`), NativeWind & Tailwind CSS

---

## 📱 Kernfunktionen

### 1. Touch-Canvas (Arbeitsfläche)
- **Punktraster (Dot-Grid):** Dezent gerendertes SVG-Punktraster mit Ein/Aus-Schalter.
- **Flüssige Multi-Touch-Gesten (Reanimated worklets):**
  - **1-Finger-Drag:** Freies Verschieben des Elements.
  - **Pinch-to-Zoom:** Stufenloses Skalieren.
  - **Two-Finger-Rotation:** Freies Drehen des Kleidungsstücks.
  - **Tap:** Auswählen des Elements (zeigt gestrichelten Rahmen und Eck-Griffe).
- **Quick-Action-Overlay (Floating Toolbar):**
  - **Vor / Zurück (Z-Index):** Ändert die Ebenenreihenfolge von Kleidungsstücken.
  - **Crop (Zuschneiden):** Öffnet das manuelle Rechteck-Zuschneidetool.
  - **Spiegeln:** Horizontales Flippen.
  - **Kopieren (Duplizieren):** Klont das Element auf der Arbeitsfläche.
  - **Löschen:** Entfernt das Teil mit haptischem Feedback.

### 2. Garderobe & Import ("Kleiderschrank")
- **Slide-Up Bottom-Sheet:**
  - 2-spaltiges Masonry-Raster aller bisher hinzugefügten Kleidungsstücke.
  - Schnelle Filter nach Kategorien (*Alle, Oberteile, Hosen & Röcke, Kleider, Schuhe, Taschen, Accessoires*).
  - Tippen auf ein Teil platziert es sofort auf dem aktiven Board.
- **Offline-Importoptionen:**
  - 📸 **Kamera:** Neues Foto mit der Smartphone-Kamera aufnehmen.
  - 🖼 **Galerie:** Bild aus der lokalen Fotomediathek wählen.
  - 📋 **Zwischenablage:** Direkt kopierten Screenshot (z. B. aus Onlineshops oder Pinterest) einfügen.

### 3. Manuelles Zuschneiden (Crop-Tool)
- Manuelles Rechteck-Crop-Tool mit visueller Live-Vorschau und Abdunklung der abgeschnittenen Bereiche.
- Schnelle Presets:
  - *Preise unten wegschneiden (-18%)* (ideal für Screenshots mit Preisen und Kaufen-Buttons)
  - *Header oben entfernen (-14%)* (entfernt Adressleiste und Webshop-Menü)
  - *Oben & Unten gleichzeitig*
  - *Feinabstimmung* über Inset-Schritte für alle 4 Kanten.
- Ausführung via `expo-image-manipulator` ohne Datenverlust.

### 4. Outfit-Verwaltung & Export
- **Outfit-Galerie:**
  - Mehrere Moodboards anlegen und verwalten (z. B. *"Herbst Capsule Chic"*, *"Sommerhochzeit"*, *"Casual Sunday"*).
- **Outfit duplizieren (1:1 Kopie):**
  - Erstellt mit einem Klick eine exakte Kopie des aktuellen Boards, um alternative Schuhe, Jacken oder Taschen auszuprobieren.
- **Sauberer Export:**
  - Rendert das Board per `react-native-view-shot` in voller Auflösung.
  - Raster, Rahmen und Bedienelemente werden beim Export automatisch ausgeblendet.
  - Speichern direkt in der Apple Fotos / Google Fotos Mediathek (`expo-media-library`) oder Weiterleiten via systemweitem Share-Sheet (`expo-sharing`).

---

## 🚀 App starten

Das Projekt befindet sich im Verzeichnis `C:\Users\anifi\Documents\StyleBoard`.

### 1. In das Verzeichnis wechseln
```bash
cd StyleBoard
```

### 2. Entwicklungsserver starten
```bash
npx expo start
```

- **iOS Simulator:** Taste `i` drücken (oder QR-Code mit der Expo Go App auf dem iPhone scannen).
- **Android Emulator / Gerät:** Taste `a` drücken (oder QR-Code mit Expo Go auf Android scannen).
- **Web-Vorschau:** Taste `w` drücken oder `npm run web` ausführen.
