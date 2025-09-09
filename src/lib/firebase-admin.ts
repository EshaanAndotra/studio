import admin from 'firebase-admin';

const app = admin.apps.length
  ? admin.app()
  : admin.initializeApp({
      storageBucket: 'm-health-jxug7.appspot.com',
    });

const storage = app.storage();

export { app, storage };
