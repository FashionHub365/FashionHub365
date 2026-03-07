const config = require('../config/config');
const outboxService = require('./outbox.service');
const paymentReconcileService = require('./paymentReconcile.service');

const timers = [];
let started = false;

const safeRun = async (label, fn) => {
    try {
        await fn();
    } catch (error) {
        console.error(`[worker:${label}]`, error.message);
    }
};

const startWorkers = () => {
    if (started) {
        return;
    }

    const outboxIntervalMs = Number(config.outbox.intervalSeconds || 10) * 1000;
    const reconcileIntervalMs = Number(config.payment.reconcileIntervalSeconds || 60) * 1000;

    const outboxTimer = setInterval(() => {
        safeRun('outbox', async () => {
            await outboxService.processOutboxBatch({ maxEvents: 50 });
        });
    }, outboxIntervalMs);

    const reconcileTimer = setInterval(() => {
        safeRun('payment_reconcile', async () => {
            await paymentReconcileService.reconcilePaymentFlow({ limit: 200 });
        });
    }, reconcileIntervalMs);

    if (typeof outboxTimer.unref === 'function') {
        outboxTimer.unref();
    }
    if (typeof reconcileTimer.unref === 'function') {
        reconcileTimer.unref();
    }

    timers.push(outboxTimer, reconcileTimer);
    started = true;
    console.log(
        `[worker] started: outbox=${outboxIntervalMs}ms, reconcile=${reconcileIntervalMs}ms`
    );
};

const stopWorkers = () => {
    while (timers.length) {
        const timer = timers.pop();
        clearInterval(timer);
    }
    started = false;
};

module.exports = {
    startWorkers,
    stopWorkers,
};
