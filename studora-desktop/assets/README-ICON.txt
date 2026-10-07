# Ikon för Studora Windows-app

Plats för ikon: ../web/logo.png

Nuvarande situation:
- web/logo.png innehåller för närvarande en FREEAI-logotyp (ej giltig Studora-logotyp)
- Vi fortsätter med Windows-installerare utan korrekt ikon
- När korrekt Studora-logotyp finns, ladda upp den till web/logo.png

Windows-installerare byggs med:
  npm run build:win

Installeraren skapas i:
  release/

När ikonen är korrekt:
- Windows-appens ikon: web/logo.png
- Startmenyikon: web/logo.png
- Aktivitetsfältets ikon: web/logo.png
- Installerarens ikon: web/logo.png

Inget manuellt ikon-genererande behövs – electron-builder hanterar det från PNG.
