import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  // Dashboard Stats
  app.get('/api/stats', (_req: Request, res: Response) => {
    try {
      const stats = store.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Patients
  app.get('/api/patients', (req: Request, res: Response) => {
    try {
      const { search, status, condition } = req.query as {
        search?: string;
        status?: string;
        condition?: string;
      };
      const patients = store.getPatients({ search, status, condition });
      res.json({ success: true, data: patients });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const patient = store.getPatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      res.json({ success: true, data: patient });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/patients', (req: Request, res: Response) => {
    try {
      const { name, phone, age, gender, address, locality, city, pincode, deliveryPreference, chronicConditions, doctorName, medications, refillCycleDays, lastRefillDate, nextRefillDueDate, consent, notes, active } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, error: 'Patient name and phone number are required' });
      }

      const newPatient = store.addPatient({
        name,
        phone,
        age: Number(age) || 45,
        gender: gender || 'Other',
        address: address || '',
        locality: locality || '',
        city: city || 'Mumbai',
        pincode: pincode || '400058',
        deliveryPreference: deliveryPreference || 'home_delivery',
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
        doctorName: doctorName || '',
        medications: Array.isArray(medications) ? medications : [],
        refillCycleDays: Number(refillCycleDays) || 30,
        lastRefillDate: lastRefillDate || new Date().toISOString().split('T')[0],
        nextRefillDueDate: nextRefillDueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        consent: consent || {
          status: 'opted_in',
          timestamp: new Date().toISOString(),
          source: 'in_store_form',
          notes: 'Consent recorded at in-store counter registration',
        },
        reminderStatus: 'upcoming',
        notes: notes || '',
        active: active !== undefined ? active : true,
      });

      res.status(201).json({ success: true, data: newPatient });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updatePatient(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/patients/:id/consent', (req: Request, res: Response) => {
    try {
      const { status, reason, notes } = req.body;
      if (!['opted_in', 'paused', 'opted_out'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid consent status' });
      }
      const updated = store.updatePatientConsent(req.params.id, status, reason, notes);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const deleted = store.deletePatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      res.json({ success: true, message: 'Patient record permanently deleted per privacy standards' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Refill Requests
  app.get('/api/refill-requests', (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const requests = store.getRefillRequests(status);
      res.json({ success: true, data: requests });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/refill-requests', (req: Request, res: Response) => {
    try {
      const newReq = store.createRefillRequest(req.body);
      res.status(201).json({ success: true, data: newReq });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch('/api/refill-requests/:id/status', (req: Request, res: Response) => {
    try {
      const { status, staffName, invoiceNumber, paymentStatus } = req.body;
      const updated = store.updateRefillRequestStatus(req.params.id, status, {
        staffName,
        invoiceNumber,
        paymentStatus,
      });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Refill request not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reminders
  app.get('/api/reminders', (_req: Request, res: Response) => {
    try {
      const reminders = store.getReminders();
      res.json({ success: true, data: reminders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/reminders/dispatch', (req: Request, res: Response) => {
    try {
      const { patientId, customMessage } = req.body;
      if (!patientId) {
        return res.status(400).json({ success: false, error: 'patientId is required' });
      }
      const result = store.dispatchReminder(patientId, customMessage);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.reason });
      }
      res.json({ success: true, data: result.reminder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/reminders/batch-run', (_req: Request, res: Response) => {
    try {
      const result = store.runBatchScheduler();
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Settings
  app.get('/api/settings', (_req: Request, res: Response) => {
    try {
      const settings = store.getSettings();
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = store.updateSettings(req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    try {
      const logs = store.getAuditLogs();
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // WhatsApp Chat for Patient
  app.get('/api/whatsapp/chat/:patientId', (req: Request, res: Response) => {
    try {
      const messages = store.getChatMessages(req.params.patientId);
      res.json({ success: true, data: messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Interactive WhatsApp Simulation / Test Endpoint
  app.post('/api/whatsapp/simulate-incoming', (req: Request, res: Response) => {
    try {
      const { patientId, actionPayload, textReply } = req.body;
      if (!patientId || !actionPayload) {
        return res.status(400).json({ success: false, error: 'patientId and actionPayload are required' });
      }
      const result = store.handleWhatsAppInbound(patientId, actionPayload, textReply);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Official WhatsApp Webhook verification (Meta Business Cloud API)
  app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
    const settings = store.getSettings();
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === settings.metaCloudApi.webhookVerifyToken) {
      console.log('[Meta Webhook Verified]');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden verification token');
  });

  // Official WhatsApp Webhook receiver (Meta Business Cloud API)
  app.post('/api/whatsapp/webhook', (req: Request, res: Response) => {
    try {
      const body = req.body;
      // Meta webhook standard payload parsing
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const msg = messages[0];
          const fromPhone = msg.from; // Phone without '+'
          const formattedPhone = fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`;

          // Find patient by phone
          const patients = store.getPatients();
          const patient = patients.find((p) => p.phone.replace(/[^0-9]/g, '') === fromPhone.replace(/[^0-9]/g, ''));

          if (patient) {
            let actionPayload = 'CUSTOM_TEXT';
            let text = msg.text?.body || '';

            if (msg.type === 'interactive' && msg.interactive?.button_reply) {
              actionPayload = msg.interactive.button_reply.id;
              text = msg.interactive.button_reply.title;
            } else if (text.toUpperCase().includes('REFILL') || text.toUpperCase() === '1') {
              actionPayload = 'ACTION_REQUEST_REFILL';
            } else if (text.toUpperCase().includes('LATER') || text.toUpperCase() === '2') {
              actionPayload = 'ACTION_REMIND_LATER';
            } else if (text.toUpperCase().includes('STOP') || text.toUpperCase() === '3') {
              actionPayload = 'ACTION_STOP_REMINDERS';
            }

            store.handleWhatsAppInbound(patient.id, actionPayload, text);
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (err: any) {
      console.error('Webhook error:', err);
      return res.status(500).send('Webhook processing error');
    }
  });

  // Demo Reset Endpoint
  app.post('/api/demo/reset', (_req: Request, res: Response) => {
    try {
      store.resetToSeed();
      res.json({ success: true, message: 'Store reset to rich seed data successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Export Data for Compliance
  app.get('/api/export', (_req: Request, res: Response) => {
    try {
      const patients = store.getPatients();
      const reminders = store.getReminders();
      const refillRequests = store.getRefillRequests();
      const auditLogs = store.getAuditLogs();
      const settings = store.getSettings();

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="apnachemist_crm_data_export.json"');
      res.json({
        exportedAt: new Date().toISOString(),
        pharmacy: settings.name,
        drugLicense: settings.dlNumber,
        patients,
        reminders,
        refillRequests,
        auditLogs,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // Frontend Serving (Vite dev middlewares or static dist)
  // ----------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApnaChemist CRM Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ApnaChemist CRM server:', err);
  process.exit(1);
});
