import admin from 'firebase-admin';

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp();

const storage = app.storage();

export { app, storage };
