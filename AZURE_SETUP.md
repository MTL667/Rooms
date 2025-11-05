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

## External Tenant Calendar Invitations

### Environment Variable
```env
AZURE_AD_TENANT_DOMAIN=yourdomain.com
```

Set this to your **primary organization's email domain** (e.g., `company.com`).

### How it works:

#### Internal Users (Same Organization)
- Email domain matches `AZURE_AD_TENANT_DOMAIN`
- Calendar events created in **both** calendars:
  1. User's Outlook calendar
  2. Room resource calendar
- User receives native Outlook invitation
- Full Microsoft Graph integration

#### External Users (Guest Organizations)
- Email domain **different** from `AZURE_AD_TENANT_DOMAIN`
- Calendar event created **only** in room calendar
- User receives email with **iCal (.ics) attachment**
- User can import to their own calendar system
- Works across any email/calendar provider

### Example Flow:

**Internal User** (`john@company.com`):
```
User books room
  → Event in john@company.com calendar ✅
  → Event in meetingroom@company.com calendar ✅
  → Native Outlook invitation ✅
```

**External User** (`jane@partner.com`):
```
User books room
  → Event in meetingroom@company.com calendar ✅
  → Email with .ics attachment to jane@partner.com 📧
  → jane opens .ics → adds to her calendar ✅
```

### Why?

Multi-tenant Azure AD apps can only access calendars **within their own tenant**. External users from other organizations need calendar invitations via standard iCal format, which works universally across all calendar systems (Outlook, Google Calendar, Apple Calendar, etc.).

### Tenant Domain Configuration

Add the `domain` field to allowed tenants for proper external user detection:

```sql
UPDATE "AllowedTenant" 
SET domain = 'yourdomain.com'
WHERE tenant_id = 'your-tenant-id';
```

Tenants with `domain` matching `AZURE_AD_TENANT_DOMAIN` = Internal users
All other tenants = External users (get iCal attachments)
