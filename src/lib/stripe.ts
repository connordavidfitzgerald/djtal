import Stripe from 'stripe';
import { readEnv } from './env';

let client: Stripe | null = null;

export function stripeEnabled(): boolean {
    return !!readEnv('STRIPE_SECRET_KEY');
}

export function getStripe(): Stripe {
    if (!client) {
        const key = readEnv('STRIPE_SECRET_KEY');
        if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
        client = new Stripe(key);
    }
    return client;
}
