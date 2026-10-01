import {
  ApixClient,
  CheckoutMode,
  GatewayCode,
  KokoCallbackPayload,
  KokoReturnPayload,
  PaymentElementsRenderer,
  type CreateOrderOptionsInput,
  type CurrencyCodesData,
  type LookupIpParams,
  type PaymentElementsAvailability,
} from '@avraapi/node-sdk';

const client = new ApixClient({
  projectKey: 'test-client-id',
  apiSecret: 'test-client-secret',
  env: 'development',
});

const lookup: LookupIpParams = { ip: '203.0.113.10' };
const currencyData: CurrencyCodesData = {
  count: 1,
  codes: [{ code: 'LKR', name: 'Sri Lankan Rupee' }],
};
const paymentOrder: CreateOrderOptionsInput = {
  gateway: GatewayCode.PayHere,
  mode: CheckoutMode.Redirect,
  orderId: 'ORDER-100',
  items: 'Test item',
  amount: '10.00',
  currency: 'LKR',
  customer: {
    first_name: 'Saman', last_name: 'Perera', email: 'buyer@example.test', phone: '0771234567',
    address: 'No. 1', city: 'Colombo', country: 'Sri Lanka',
  },
  urls: { return_url: 'https://shop.example.test/return' },
};

void client.location().lookupIp(lookup);
void client.currency().getCodes();
void client.payment().createOrder(paymentOrder);
const availability: PaymentElementsAvailability = {
  ready: true,
  reason: null,
  message: null,
  methods: [{ gateway: 'payhere', available: true }],
};
void PaymentElementsRenderer.renderMethods('paymentMethods', { availability });
void KokoCallbackPayload.fromForm({ orderId: 'ORDER-100', trnId: 'TRN-1', status: 'SUCCESS', desc: 'Approved', signature: 'signature' });
void KokoReturnPayload.fromQuery({ orderId: 'ORDER-100', trnId: 'TRN-1', status: 'SUCCESS' });
void currencyData;
