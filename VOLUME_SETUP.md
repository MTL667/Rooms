# Volume Setup voor Floor Plan Uploads

## Easypanel Volume Configuratie

De plattegrond afbeeldingen worden opgeslagen in een persistent volume om data te behouden tussen deployments.

### Stap 1: Volume aanmaken in Easypanel

1. Ga naar je service in Easypanel
2. Klik op **"Volumes"** tab
3. Klik op **"Add Volume"**
4. Configureer als volgt:
   - **Name**: `uploads`
   - **Mount Path**: `/app/public/uploads`
   - **Size**: Kies een passende grootte (bijv. 5GB of meer, afhankelijk van je behoeften)
5. Klik op **"Save"**

### Stap 2: Permissions instellen

Na deployment moet je ervoor zorgen dat de applicatie schrijfrechten heeft:

```bash
# Via Easypanel terminal (indien nodig)
chmod -R 755 /app/public/uploads
chown -R node:node /app/public/uploads
```

### Stap 3: Directory structuur

De applicatie maakt automatisch de volgende directory structuur aan:
```
/app/public/uploads/
  └── floorplans/
      └── [uploaded images]
```

## Bestandslimieten

De upload heeft de volgende limieten:
- **Toegestane formaten**: PNG, JPG, JPEG, GIF, WebP
- **Maximum bestandsgrootte**: 10MB (configureerbaar)

## Backup

Het volume bevat belangrijke data. Zorg voor regelmatige backups:

1. In Easypanel kun je volume snapshots maken
2. Of gebruik een backup script om bestanden te kopiëren

## Docker Compose (optioneel)

Als je docker-compose gebruikt, voeg dit toe aan je configuratie:

```yaml
volumes:
  uploads:
    driver: local

services:
  app:
    volumes:
      - uploads:/app/public/uploads
```

## Troubleshooting

### Upload werkt niet
- Controleer of het volume correct gemount is
- Controleer filesystem permissions
- Check de logs voor errors: `Failed to upload file`

### Afbeeldingen worden niet getoond
- Controleer of de URL correct is: `/uploads/floorplans/[filename]`
- Controleer of Next.js de public folder correct serveert
- Check browser console voor 404 errors

### Na deployment zijn uploads verdwenen
- Zorg dat het volume persistent is (niet ephemeral)
- Controleer of het volume aan de juiste mount path gekoppeld is
- Maak backups VOOR het verwijderen/recreëren van services

