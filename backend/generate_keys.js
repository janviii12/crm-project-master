import webPush from 'web-push';
import fs from 'fs';

const keys = webPush.generateVAPIDKeys();

fs.appendFileSync('.env', `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`);

console.log('VAPID keys generated and added to .env');
