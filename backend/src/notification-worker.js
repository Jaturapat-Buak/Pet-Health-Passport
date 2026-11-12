import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import { writeFile } from 'node:fs/promises';
import { pool } from './config/database.js';
import { jobsToQueue, markQueued, processNotification, syncDueAppointments } from './services/appointment-notifications.js';

const queue = 'appointment-email';
const deadQueue = 'appointment-email-dead';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function waitForSchema() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await pool.query('SELECT 1 FROM appointment_notifications LIMIT 1');
      return;
    } catch (error) {
      if (attempt === 59) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function connectToRabbitMQ() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      return await amqp.connect({ protocol: 'amqp', hostname: process.env.RABBITMQ_HOST,
        username: process.env.RABBITMQ_USER, password: process.env.RABBITMQ_PASSWORD });
    } catch (error) {
      if (attempt === 59) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function start() {
  if (!process.env.RABBITMQ_HOST || !process.env.RABBITMQ_USER || !process.env.RABBITMQ_PASSWORD || !process.env.SMTP_HOST) {
    throw new Error('RABBITMQ_HOST, RABBITMQ_USER, RABBITMQ_PASSWORD and SMTP_HOST are required');
  }
  await waitForSchema();
  const connection = await connectToRabbitMQ();
  connection.on('error', (error) => console.error('RabbitMQ connection error:', error));
  connection.on('close', () => { console.error('RabbitMQ connection closed'); process.exit(1); });
  const channel = await connection.createConfirmChannel();
  await channel.assertQueue(deadQueue, { durable: true });
  await channel.assertQueue(queue, { durable: true, arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': deadQueue } });
  await channel.prefetch(1);

  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {})
  });
  const sendMail = (message) => smtp.sendMail({ from: process.env.SMTP_FROM ?? 'Pet Health Passport <no-reply@pet-health.local>', ...message });

  await channel.consume(queue, async (delivery) => {
    if (!delivery) return;
    try {
      const job = JSON.parse(delivery.content.toString('utf8'));
      if (!uuid.test(job.id) || Number.isNaN(Date.parse(job.appointment_date))) {
        channel.nack(delivery, false, false);
        return;
      }
      await processNotification(job.id, job.appointment_date, sendMail);
      channel.ack(delivery);
    } catch (error) {
      console.error('Notification delivery could not be processed:', error);
      channel.nack(delivery, false, false);
    }
  }, { noAck: false });

  let scanning = false;
  async function scan() {
    if (scanning) return;
    scanning = true;
    try {
      await syncDueAppointments();
      for (const job of await jobsToQueue()) {
        const appointmentDate = new Date(job.appointment_date).toISOString();
        await new Promise((resolve, reject) => channel.sendToQueue(queue,
          Buffer.from(JSON.stringify({ id: job.id, appointment_date: appointmentDate })),
          { persistent: true, messageId: job.id }, (error) => error ? reject(error) : resolve()));
        await markQueued(job.id, appointmentDate);
      }
      await writeFile('/tmp/notification-worker-heartbeat', String(Date.now()));
    } catch (error) {
      console.error('Notification scan failed:', error);
    } finally {
      scanning = false;
    }
  }
  await scan();
  const timer = setInterval(scan, 15000);
  async function close() {
    clearInterval(timer);
    connection.removeAllListeners('close');
    await connection.close();
    await pool.end();
    process.exit(0);
  }
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  console.log('Appointment notification worker is ready');
}

start().catch(async (error) => {
  console.error('Appointment notification worker failed:', error);
  await pool.end();
  process.exit(1);
});
