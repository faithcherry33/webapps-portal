const admin = require('firebase-admin');

function hasFirebaseEnv() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

function getFirebaseAdmin() {
  if (!hasFirebaseEnv()) {
    throw new Error('Firebase environment variables are not configured.');
  }

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }

  return admin;
}

module.exports = {
  getFirebaseAdmin,
  hasFirebaseEnv
};
