export type Language = 'nl' | 'fr' | 'en';

export const translations = {
  nl: {
    // Navigation
    dashboard: 'Dashboard',
    myBookings: 'Boekingen',
    floorPlan: 'Plattegrond',
    admin: 'Admin',
    signOut: 'Afmelden',
    signIn: 'Aanmelden',
    back: 'Terug',
    
    // Dashboard
    roomsAvailability: 'Beschikbaarheid',
    today: 'Vandaag',
    previousDay: 'Vorige dag',
    nextDay: 'Volgende dag',
    available: 'Beschikbaar',
    book: 'Boek',
    addRooms: 'Rooms Toevoegen',
    loading: 'Laden...',
    loadingRooms: 'Rooms laden...',
    
    // Booking
    bookRoom: 'Boek',
    editBooking: 'Bewerk',
    title: 'Titel',
    description: 'Beschrijving',
    date: 'Datum',
    startTime: 'Start Tijd',
    endTime: 'Eind Tijd',
    confirm: 'Bevestigen',
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    bookingSuccessful: 'Boeking Succesvol!',
    bookingConfirmed: 'Je boeking is bevestigd',
    bookingOutsideBusinessHours: 'Booking moet binnen werktijden vallen (6:00-22:00)',
    titlePlaceholder: 'Bijvoorbeeld: Team Meeting',
    descriptionPlaceholder: 'Optionele beschrijving...',
    
    // Room info
    people: 'personen',
    capacity: 'Capaciteit',
    location: 'Locatie',
    
    // My Bookings
    upcoming: 'Aankomend',
    past: 'Verleden',
    noUpcomingBookings: 'Geen aankomende boekingen',
    noPastBookings: 'Geen eerdere boekingen',
    
    // Floor Plan
    selectFloorPlan: 'Selecteer Plattegrond',
    noFloorPlans: 'Geen plattegronden beschikbaar',
    clickToBook: 'Klik op een kamer om te boeken',
    
    // Admin
    roomsManagement: 'Rooms Beheer',
    floorPlansManagement: 'Plattegronden Beheer',
    tenantsManagement: 'Bedrijven Beheer',
    usersManagement: 'Gebruikers Beheer',
    addRoom: 'Room Toevoegen',
    editRoom: 'Room Bewerken',
    newRoom: 'Nieuwe Room',
    name: 'Naam',
    active: 'Actief',
    actions: 'Acties',
    edit: 'Bewerken',
    bookings: 'Boekingen',
    
    // Messages
    unauthorized: 'Niet geautoriseerd',
    error: 'Fout',
    success: 'Succes',
    deleteConfirm: 'Weet je zeker dat je deze wilt verwijderen?',
    
    // Tooltips
    clickToEdit: 'Klik om te bewerken',
    dragToMove: 'Sleep om te verplaatsen',
    resizeEdges: 'Sleep randen om tijd aan te passen',
    dragToMoveRoom: 'Sleep naar andere room',
    
    // Days of week
    monday: 'maandag',
    tuesday: 'dinsdag',
    wednesday: 'woensdag',
    thursday: 'donderdag',
    friday: 'vrijdag',
    saturday: 'zaterdag',
    sunday: 'zondag',
    
    // Language
    language: 'Taal',
    dutch: 'Nederlands',
    french: 'Frans',
    english: 'Engels',
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    myBookings: 'Réservations',
    floorPlan: 'Plan',
    admin: 'Admin',
    signOut: 'Déconnexion',
    signIn: 'Connexion',
    back: 'Retour',
    
    // Dashboard
    roomsAvailability: 'Disponibilité',
    today: 'Aujourd\'hui',
    previousDay: 'Jour précédent',
    nextDay: 'Jour suivant',
    available: 'Disponible',
    book: 'Réserver',
    addRooms: 'Ajouter des Salles',
    loading: 'Chargement...',
    loadingRooms: 'Chargement des salles...',
    
    // Booking
    bookRoom: 'Réserver',
    editBooking: 'Modifier',
    title: 'Titre',
    description: 'Description',
    date: 'Date',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    bookingSuccessful: 'Réservation Réussie!',
    bookingConfirmed: 'Votre réservation est confirmée',
    bookingOutsideBusinessHours: 'La réservation doit être dans les heures d\'ouverture (6:00-22:00)',
    titlePlaceholder: 'Par exemple: Réunion d\'équipe',
    descriptionPlaceholder: 'Description optionnelle...',
    
    // Room info
    people: 'personnes',
    capacity: 'Capacité',
    location: 'Emplacement',
    
    // My Bookings
    upcoming: 'À venir',
    past: 'Passées',
    noUpcomingBookings: 'Aucune réservation à venir',
    noPastBookings: 'Aucune réservation passée',
    
    // Floor Plan
    selectFloorPlan: 'Sélectionner le plan',
    noFloorPlans: 'Aucun plan disponible',
    clickToBook: 'Cliquez sur une salle pour réserver',
    
    // Admin
    roomsManagement: 'Gestion des Salles',
    floorPlansManagement: 'Gestion des Plans',
    tenantsManagement: 'Gestion des Entreprises',
    usersManagement: 'Gestion des Utilisateurs',
    addRoom: 'Ajouter une Salle',
    editRoom: 'Modifier la Salle',
    newRoom: 'Nouvelle Salle',
    name: 'Nom',
    active: 'Actif',
    actions: 'Actions',
    edit: 'Modifier',
    bookings: 'Réservations',
    
    // Messages
    unauthorized: 'Non autorisé',
    error: 'Erreur',
    success: 'Succès',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ceci?',
    
    // Tooltips
    clickToEdit: 'Cliquer pour modifier',
    dragToMove: 'Glisser pour déplacer',
    resizeEdges: 'Glisser les bords pour ajuster l\'heure',
    dragToMoveRoom: 'Glisser vers une autre salle',
    
    // Days of week
    monday: 'lundi',
    tuesday: 'mardi',
    wednesday: 'mercredi',
    thursday: 'jeudi',
    friday: 'vendredi',
    saturday: 'samedi',
    sunday: 'dimanche',
    
    // Language
    language: 'Langue',
    dutch: 'Néerlandais',
    french: 'Français',
    english: 'Anglais',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    myBookings: 'Bookings',
    floorPlan: 'Floor Plan',
    admin: 'Admin',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    back: 'Back',
    
    // Dashboard
    roomsAvailability: 'Availability',
    today: 'Today',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    available: 'Available',
    book: 'Book',
    addRooms: 'Add Rooms',
    loading: 'Loading...',
    loadingRooms: 'Loading rooms...',
    
    // Booking
    bookRoom: 'Book',
    editBooking: 'Edit',
    title: 'Title',
    description: 'Description',
    date: 'Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    confirm: 'Confirm',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    bookingSuccessful: 'Booking Successful!',
    bookingConfirmed: 'Your booking is confirmed',
    bookingOutsideBusinessHours: 'Booking must be within business hours (6:00-22:00)',
    titlePlaceholder: 'For example: Team Meeting',
    descriptionPlaceholder: 'Optional description...',
    
    // Room info
    people: 'people',
    capacity: 'Capacity',
    location: 'Location',
    
    // My Bookings
    upcoming: 'Upcoming',
    past: 'Past',
    noUpcomingBookings: 'No upcoming bookings',
    noPastBookings: 'No past bookings',
    
    // Floor Plan
    selectFloorPlan: 'Select Floor Plan',
    noFloorPlans: 'No floor plans available',
    clickToBook: 'Click on a room to book',
    
    // Admin
    roomsManagement: 'Rooms Management',
    floorPlansManagement: 'Floor Plans Management',
    tenantsManagement: 'Tenants Management',
    usersManagement: 'Users Management',
    addRoom: 'Add Room',
    editRoom: 'Edit Room',
    newRoom: 'New Room',
    name: 'Name',
    active: 'Active',
    actions: 'Actions',
    edit: 'Edit',
    bookings: 'Bookings',
    
    // Messages
    unauthorized: 'Unauthorized',
    error: 'Error',
    success: 'Success',
    deleteConfirm: 'Are you sure you want to delete this?',
    
    // Tooltips
    clickToEdit: 'Click to edit',
    dragToMove: 'Drag to move',
    resizeEdges: 'Drag edges to adjust time',
    dragToMoveRoom: 'Drag to another room',
    
    // Days of week
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday',
    
    // Language
    language: 'Language',
    dutch: 'Dutch',
    french: 'French',
    english: 'English',
  },
};

export type TranslationKey = keyof typeof translations.nl;

