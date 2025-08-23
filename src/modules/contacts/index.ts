// Contacts module exports
export { default as ContactsList } from './ContactsList';
export { default as ContactForm } from './ContactForm';
export { default as ContactDetails } from './ContactDetails';

// Re-export types and utilities from contacts lib
export type { Contact, ContactWithClient } from '@/lib/contacts';
export { ContactSchema } from '@/lib/contacts';