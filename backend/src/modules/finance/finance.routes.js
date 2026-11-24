import { Router } from 'express';
import { z } from 'zod';
import { collection, mongoOptions } from '../../config/mongoDatabase.js';
import { authorize } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { recordPayment, refundPayment } from '../payments/payment.service.js';
import { recordPaymentInput, refundPaymentInput } from '../payments/payment.validation.js';
import {
  expenseInput,
  adjustmentInput,
  financeQuery,
  submissionKey,
} from './finance.validation.js';
import {
  expenseHistory,
  financeContext,
  financeOverview,
  listFinanceRows,
  recordAdjustment,
  reverseExpense,
  saveExpense,
} from './finance.service.js';

export function createFinanceRouter(db) {
  const router = Router();
  const finance = Router();
  router.use('/api/admin/finance', authorize('admin'), finance);
  const validateQuery = validateRequest(financeQuery, 'query');
  const params = validateRequest(z.object({ id: z.uuid() }), 'params');
  const timezone = async () => (await financeContext(db, { period: 'today' })).timezone;
  const outcomes = {
    overview: (result) => result,
    'revenue-trends': ({ series }) => ({ series }),
    'revenue-by-source': ({ sources }) => ({ sources }),
    'revenue-by-category': ({ categories }) => ({ categories }),
    'revenue-by-vehicle': ({ vehicles }) => ({ vehicles }),
    'payment-methods': ({ methods }) => ({ methods }),
    'profit-loss': ({ current, previous, series, changes }) => ({
      current,
      previous,
      series,
      changes,
    }),
  };
  for (const [route, present] of Object.entries(outcomes)) {
    finance.get('/' + route, validateQuery, async (req, res) => {
      const query = req.validated.query;
      const context = await financeContext(db, query);
      res.json({ ...context, ...present(await financeOverview(db, query, context)) });
    });
  }
  for (const route of ['transactions', 'expenses']) {
    finance.get('/' + route, validateQuery, async (req, res) => {
      const query = req.validated.query;
      const context = await financeContext(db, query);
      res.json({
        ...context,
        ...(await listFinanceRows(db, query, context, route === 'expenses')),
      });
    });
  }
  finance.post(
    '/expenses',
    validateRequest(expenseInput.extend({ submissionKey })),
    async (req, res) => {
      res.status(201).json(await saveExpense(db, req.user, req.validated.body, await timezone()));
    },
  );
  finance.patch(
    '/expenses/:id',
    params,
    validateRequest(
      expenseInput.extend({
        version: z.number().int().min(1),
      }),
    ),
    async (req, res) => {
      res.json(
        await saveExpense(
          db,
          req.user,
          req.validated.body,
          await timezone(),
          req.validated.params.id,
        ),
      );
    },
  );
  finance.post(
    '/expenses/:id/reverse',
    params,
    validateRequest(
      expenseInput.pick({ date: true }).extend({
        version: z.number().int().min(1),
        submissionKey,
        notes: z.string().trim().min(3).max(1000),
      }),
    ),
    async (req, res) => {
      res
        .status(201)
        .json(
          await reverseExpense(
            db,
            req.user,
            req.validated.params.id,
            req.validated.body,
            await timezone(),
          ),
        );
    },
  );
  finance.get('/expenses/:id/history', params, async (req, res) => {
    res.json({ rows: await expenseHistory(db, req.validated.params.id) });
  });
  finance.get(
    '/bookings',
    validateRequest(
      z.object({
        search: z.string().trim().min(2).max(80),
      }),
      'query',
    ),
    async (req, res) => {
      const prefix = new RegExp('^' + RegExp.escape(req.validated.query.search.toUpperCase()));
      const rows = await collection(db, 'bookings')
        .find(
          { reference: prefix },
          mongoOptions(db, {
            projection: { _id: 0, id: 1, reference: 1, status: 1 },
            maxTimeMS: 5000,
          }),
        )
        .sort({ reference: 1 })
        .limit(15)
        .toArray();
      res.json({ rows });
    },
  );
  finance.post(
    '/bookings/:id/payments',
    params,
    validateRequest(recordPaymentInput.extend({ submissionKey })),
    async (req, res) => {
      const booking = await recordPayment(db, {
        user: req.user,
        params: req.validated.params,
        body: req.validated.body,
      });
      res.status(201).json({ bookingId: booking.id });
    },
  );
  finance.post(
    '/payments/:id/refund',
    params,
    validateRequest(refundPaymentInput.extend({ submissionKey })),
    async (req, res) => {
      res.status(201).json(
        await refundPayment(db, {
          user: req.user,
          params: req.validated.params,
          body: req.validated.body,
        }),
      );
    },
  );
  finance.post('/adjustments', validateRequest(adjustmentInput), async (req, res) => {
    res
      .status(201)
      .json(await recordAdjustment(db, req.user, req.validated.body, await timezone()));
  });
  finance.get('/reports/export', validateQuery, async (req, res) => {
    const query = req.validated.query;
    const context = await financeContext(db, query);
    const { reportSections, renderReport } = await import('./finance.reports.js');
    const sections = await reportSections(db, query, context);
    const { mime, bytes } = await renderReport(sections, query.format);
    res
      .set('Content-Type', mime)
      .attachment('riderent-' + query.report + '-' + context.fromDate + '.' + query.format)
      .set('Content-Type', mime)
      .send(bytes);
  });
  return router;
}
