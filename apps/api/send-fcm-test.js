const admin = require('firebase-admin');
const path = require('path');

// 1) Path to your service account JSON
const serviceAccount = require(path.join(__dirname, 'firebase-service-account.json'));

// 2) Your device FCM token
const FCM_TOKEN = 'fOuzaSXwfOvGGPHmw_N8Dx:APA91bFFW3dq7lM3K_bDXBRE9claco22PE7rkvd4_VjxUpPYyO8gWVxIXYU0j81PE4juKr_k2rpwOBam5_8cRl8YVu15lp08e1LsPULt0-Z1S_tq45ZCT_0';

// 3) Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  try {
    const message = {
      token: FCM_TOKEN,
      notification: {
        title: 'Test from MargWatch API',
        body: 'If you see this, HTTP v1 works ✅',
      },
      data: {
        type: 'TEST',
        screen: 'notifications',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default', // or whatever channel you use in the app
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (err) {
    console.error('Error sending message:', err);
  } finally {
    process.exit(0);
  }
}

main();