# Environment Variables voor EasyPanel

## Vereiste Variables

### 1. Database
```
DATABASE_URL=postgresql://user:password@host:5432/rooms
```
**Tip**: Maak een PostgreSQL database aan in EasyPanel en gebruik de connection string.

### 2. NextAuth Configuratie
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-a-random-long-string-min-32-chars
```
**Tip voor NEXTAUTH_SECRET**: Gebruik `openssl rand -base64 32` in je terminal.

### 3. Azure AD / Microsoft Entra ID
Registreer eerst een app in https://portal.azure.com:
- Ga naar "Azure Active Directory" > "App registrations"
- Klik "New registration"
- Name: "Rooms Booking"
- Supported account types: "Single tenant"
- Redirect URI: `https://your-domain.com/api/auth/callback/azure-ad`
- Noteer de **Application (client) ID** en **Directory (tenant) ID**

Vervolgens:
1. Ga naar "Certificates & secrets" → maak een "Client secret" aan
2. Ga naar "API permissions" → voeg toe:
   - `Calendars.ReadWrite` (Application permission)
   - `MailboxSettings.Read` (Application permission)
   - `Place.Read.All` (Application permission)
3. Klik "Grant admin consent"

Vul dan in:
```
AZURE_TENANT_ID=your-tenant-id-from-azure-portal
AZURE_CLIENT_ID=your-client-id-from-azure-portal
AZURE_CLIENT_SECRET=your-client-secret-from-azure
```

### 4. Email Configuratie (voor magic links)
```
EMAIL_SERVER=smtp://user:password@smtp.provider.com:587
EMAIL_FROM=noreply@your-domain.com
```

**Voorbeelden per provider**:
- **SendGrid**: `smtp://apikey:SG.xxx@smtp.sendgrid.net:587`
- **Mailgun**: `smtp://username:password@smtp.mailgun.org:587`
- **Gmail**: `smtp://your-email@gmail.com:app-password@smtp.gmail.com:587`
- **Resend**: Gebruik Resend API, geen SMTP

## Minimale Setup (zonder MS Graph)
Als je eerst wilt testen zonder Microsoft Graph integratie:
```
DATABASE_URL=...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
EMAIL_SERVER=smtp://...
EMAIL_FROM=noreply@your-domain.com
AZURE_TENANT_ID=dummy
AZURE_CLIENT_ID=dummy
AZURE_CLIENT_SECRET=dummy
```

## Database Migratie
Na de eerste deploy, run in de EasyPanel terminal:
```bash
npx prisma migrate deploy
```

Of voeg automatische migratie toe door in het Dockerfile entrypoint te checken op DATABASE_URL.

## Testen
1. Ga naar `https://your-domain.com/api/health` - zou `{"ok":true}` moeten returnen
2. Test login functionaliteit
3. Controleer logs voor eventuele errors
