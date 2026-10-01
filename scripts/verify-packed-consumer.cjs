const assert = require('node:assert/strict');
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'avraapi-node-sdk-package-'));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function execute(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

try {
  process.stdout.write('Packing local SDK artifact for consumer verification...\n');
  const packed = JSON.parse(execute(npmCommand, [
    'pack',
    '--json',
    '--pack-destination',
    temporaryDirectory,
  ]));
  assert.equal(packed.length, 1, 'npm pack must create exactly one package artifact.');

  const tarball = join(temporaryDirectory, packed[0].filename);
  assert.ok(existsSync(tarball), 'The packed SDK tarball was not created.');

  const consumerDirectory = join(temporaryDirectory, 'consumer');
  mkdirSync(consumerDirectory, { recursive: true });
  const consumerPackage = {
    name: 'avraapi-node-sdk-package-consumer',
    private: true,
    type: 'module',
  };
  writeFileSync(join(consumerDirectory, 'package.json'), `${JSON.stringify(consumerPackage, null, 2)}\n`);

  process.stdout.write('Installing the packed SDK into an offline temporary consumer...\n');
  execute(npmCommand, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--offline',
    tarball,
  ], { cwd: consumerDirectory, stdio: 'pipe' });

  writeFileSync(
    join(consumerDirectory, 'esm-consumer.mjs'),
    "import { ApixClient, PaymentService, PaymentElementsRenderer, KokoCallbackPayload, KokoReturnPayload, PayHereService, MarxPayService, OnePayService, KokoService, PayPlusService, WebXPayService } from '@avraapi/node-sdk';\n" +
      "for (const value of [ApixClient, PaymentService, PaymentElementsRenderer, KokoCallbackPayload, KokoReturnPayload, PayHereService, MarxPayService, OnePayService, KokoService, PayPlusService, WebXPayService]) if (typeof value !== 'function') throw new Error('ESM Stage 4 export is missing.');\n" +
      "const markup = PaymentElementsRenderer.renderMethods('paymentMethods', { availability: { ready: true, reason: null, message: null, methods: [{ gateway: 'payhere', available: true }] } });\n" +
      "const inline = [...markup.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].at(-1)?.[1]; new Function('window', 'document', inline);\n" +
      "if (KokoCallbackPayload.fromForm({ orderId: 'ORDER-1', trnId: 'TRN-1', status: 'SUCCESS', desc: 'Approved', signature: 'signature' }).toPayload().trnId !== 'TRN-1') throw new Error('KOKO form factory is missing.');\n" +
      "if (KokoReturnPayload.fromQuery({ orderId: 'ORDER-1', trnId: 'TRN-1' }).toPayload().trnId !== 'TRN-1') throw new Error('KOKO query factory is missing.');\n",
  );
  writeFileSync(
    join(consumerDirectory, 'cjs-consumer.cjs'),
    "const { ApixClient, PaymentService, PaymentElementsRenderer, KokoCallbackPayload, KokoReturnPayload, PayHereService, MarxPayService, OnePayService, KokoService, PayPlusService, WebXPayService } = require('@avraapi/node-sdk');\n" +
      "for (const value of [ApixClient, PaymentService, PaymentElementsRenderer, KokoCallbackPayload, KokoReturnPayload, PayHereService, MarxPayService, OnePayService, KokoService, PayPlusService, WebXPayService]) if (typeof value !== 'function') throw new Error('CommonJS Stage 4 export is missing.');\n" +
      "if (KokoCallbackPayload.fromForm({ orderId: 'ORDER-1', trnId: 'TRN-1', status: 'SUCCESS', desc: 'Approved', signature: 'signature' }).toPayload().trnId !== 'TRN-1') throw new Error('CommonJS KOKO form factory is missing.');\n" +
      "if (KokoReturnPayload.fromQuery({ orderId: 'ORDER-1', trnId: 'TRN-1' }).toPayload().trnId !== 'TRN-1') throw new Error('CommonJS KOKO query factory is missing.');\n",
  );
  writeFileSync(
    join(consumerDirectory, 'types-consumer.ts'),
    "import { ApixClient, GatewayCode, CheckoutMode, KokoCallbackPayload, KokoReturnPayload, PaymentElementsRenderer, type CreateOrderOptionsInput, type CurrencyCodesData, type PaymentElementsAvailability } from '@avraapi/node-sdk';\n" +
      "const client = new ApixClient({ projectKey: 'id', apiSecret: 'secret' });\n" +
      "const data: CurrencyCodesData = { count: 0, codes: [] };\n" +
      "const order: CreateOrderOptionsInput = { gateway: GatewayCode.PayHere, mode: CheckoutMode.Redirect, orderId: 'ORDER-1', items: 'Test', amount: '1.00', currency: 'LKR', customer: { first_name: 'A', last_name: 'B', email: 'buyer@example.test', phone: '0771234567', address: 'No. 1', city: 'Colombo', country: 'Sri Lanka' }, urls: { return_url: 'https://shop.example.test/return' } };\n" +
      "const availability: PaymentElementsAvailability = { ready: true, reason: null, message: null, methods: [] };\n" +
      "void PaymentElementsRenderer.renderMethods('paymentMethods', { availability });\n" +
      "void KokoCallbackPayload.fromForm({ orderId: 'ORDER-1', trnId: 'TRN-1', status: 'SUCCESS', desc: 'Approved', signature: 'signature' });\n" +
      "void KokoReturnPayload.fromQuery({ orderId: 'ORDER-1', trnId: 'TRN-1' });\n" +
      'void client.payment().createOrder(order);\nvoid data;\n',
  );
  writeFileSync(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2022',
        strict: true,
        noEmit: true,
      },
    }, null, 2)}\n`,
  );

  execute(process.execPath, ['esm-consumer.mjs'], { cwd: consumerDirectory, stdio: 'pipe' });
  process.stdout.write('Verifying ESM, CommonJS, and TypeScript consumer contracts...\n');
  execute(process.execPath, ['cjs-consumer.cjs'], { cwd: consumerDirectory, stdio: 'pipe' });
  execute(process.execPath, [
    join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
    '-p',
    'tsconfig.json',
  ], { cwd: consumerDirectory, stdio: 'pipe' });

  const installedPackage = JSON.parse(readFileSync(
    join(consumerDirectory, 'node_modules', '@avraapi', 'node-sdk', 'package.json'),
    'utf8',
  ));
  assert.equal(installedPackage.name, '@avraapi/node-sdk');

  process.stdout.write('Packed ESM, CommonJS, and TypeScript consumer checks passed.\n');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
