# Azure AD Setup voor Rooms App

## Redirect URI's

### Productie (rooms.kevinit.be)
```
https://rooms.kevinit.be/api/auth/callback/azure-ad
```

### Development (localhost)
```
http://localhost:3000/api/auth/callback/azure-ad
```

## Multi-Tenant Configuration

Je app is **multi-tenant**, dus:
- ✅ Alle Azure AD tenants kunnen inloggen
- ⚠️ De allowed tenants lijst in de database bepaalt wie toegang heeft

## API Permissions (Application)

Voeg de volgende **Application permissions** toe (niet Delegated):

1. **Calendars.ReadWrite** - Om events te maken/updaten in resource mailboxes
2. **MailboxSettings.Read** - Om mailbox settings te lezen
3. **Place.Read.All** - Om rooms lijst op te halen

### Stap-voor-stap:
1. Ga naar je App Registration in Azure Portal
2. Klik op "API permissions"
3. Klik "Add a permission" → "Microsoft Graph" → "Application permissions"
4. Zoek en selecteer de 3 permissions hierboven
5. Klik "Grant admin consent" (belangrijk!)
6. Wacht tot alle permissions "Granted" tonen met groene vinkjes

## Tenant ID Check

Je app controleert inloggende tenants tegen de `AllowedTenant` tabel in de database.

Om een tenant toe te voegen (na eerste database setup):
```sql
INSERT INTO "AllowedTenant" (tenant_id, name, active) 
VALUES ('a6635289-2bef-4bc0-bda9-15defbf6685f', 'Your Company', true);
```

Waar `a6635289-2bef-4bc0-bda9-15defbf6685f` je Azure AD Tenant ID is.
