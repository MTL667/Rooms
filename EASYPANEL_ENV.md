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

# Single domain
AZURE_AD_TENANT_DOMAIN=yourcompany.com

# OR multiple domains (recommended if you have multiple)
AZURE_AD_TENANT_DOMAINS=company.com,company.be,subsidiary.com
```

**AZURE_AD_TENANT_DOMAIN** / **AZURE_AD_TENANT_DOMAINS**: 
- Single domain: gebruik `AZURE_AD_TENANT_DOMAIN=company.com`
- Multiple domains: gebruik `AZURE_AD_TENANT_DOMAINS=company.com,company.be,subsidiary.com` (comma-separated)
- Dit wordt gebruikt om interne users te onderscheiden van externe/guest users
- Interne users (matching domains) krijgen native Outlook invitations
- Externe users (other domains) krijgen iCal (.ics) attachments via email
- `AZURE_AD_TENANT_DOMAINS` heeft voorrang als beide zijn ingesteld

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

### 5. SendGrid (voor booking notifications)
Voor automatische booking confirmation emails met calendar invitations:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=bookings@your-domain.com
```

**Setup**:
1. Maak een account aan op https://sendgrid.com
2. Ga naar Settings > API Keys
3. Create API Key met "Full Access" permissions
4. Verifieer je sender email/domain in SendGrid
5. Vul de API key en verified sender email in

**Features**:
- Booking confirmation emails met HTML formatting
- iCal (.ics) attachments voor externe tenants
- Automatic reminder information
- Cancellation notifications

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
