// ============================================================
// CLOUDFLARE WORKER — SalonPro
// Gère : paiements FedaPay + commissions affiliés + payouts
//
// Variables d'environnement (wrangler secret put ou dashboard) :
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY      ← clé PEM avec \n échappés
//   FEDAPAY_SECRET_KEY
//   FEDAPAY_WEBHOOK_SECRET
//   CALLBACK_URL
//   ENVIRONMENT               ← "live" en prod, vide = sandbox
//
// Déploiement : wrangler deploy
// ============================================================

export interface Env {
  FIREBASE_PROJECT_ID:    string;
  FIREBASE_CLIENT_EMAIL:  string;
  FIREBASE_PRIVATE_KEY:   string;
  FEDAPAY_SECRET_KEY:     string;
  FEDAPAY_WEBHOOK_SECRET: string;
  CALLBACK_URL:           string;
  ENVIRONMENT:            string;
}

const PLANS: Record<string, { nom: string; prix: number }> = {
  essentiel:     { nom: 'Essentiel',     prix: 9900  },
  professionnel: { nom: 'Professionnel', prix: 19900 },
  reseau:        { nom: 'Réseau',        prix: 39900 },
};

// ── JWT Firebase Admin (Web Crypto API — V8 compatible) ────
async function getFirebaseToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss:   env.FIREBASE_CLIENT_EMAIL,
    sub:   env.FIREBASE_CLIENT_EMAIL,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  }));
  const sigInput = `${header}.${payload}`;
  const keyPem   = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const pemBody  = keyPem
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const der      = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key      = await crypto.subtle.importKey(
    'pkcs8', der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(sigInput),
  );
  const jwt = `${sigInput}.${b64urlBuf(sig)}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const data = await res.json() as { access_token: string };
  if (!data.access_token) throw new Error('Firebase token error');
  return data.access_token;
}

// ── Helpers Web Crypto ──────────────────────────────────────
function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlBuf(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

// ── Vérification signature HMAC-SHA256 FedaPay ─────────────
async function verifyFedapaySignature(body: string, header: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify'],
  );
  const sig = header.replace(/^sha256=/, '');
  return crypto.subtle.verify('HMAC', key, hexToBytes(sig), new TextEncoder().encode(body));
}

// ── Helpers Firestore REST ──────────────────────────────────
function fsUrl(projectId: string, path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

async function fsGet(token: string, projectId: string, path: string) {
  const res = await fetch(fsUrl(projectId, path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fsQuery(token: string, projectId: string, collectionId: string, filters: any[]) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from:  [{ collectionId }],
          where: filters.length === 1 ? { fieldFilter: filters[0] } : {
            compositeFilter: { op: 'AND', filters: filters.map(f => ({ fieldFilter: f })) },
          },
          limit: 1,
        },
      }),
    },
  );
  const data = await res.json() as any[];
  return Array.isArray(data) && data[0]?.document ? data[0].document : null;
}

async function fsPatch(token: string, projectId: string, path: string, fields: Record<string, any>, maskFields: string[]) {
  const mask = maskFields.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  await fetch(`${fsUrl(projectId, path)}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

async function fsPost(token: string, projectId: string, collection: string, fields: Record<string, any>) {
  const res = await fetch(fsUrl(projectId, collection), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return res.json();
}

// ── Idempotence : transaction déjà traitée ? ───────────────
async function alreadyProcessed(token: string, projectId: string, transactionId: string): Promise<boolean> {
  const doc = await fsQuery(token, projectId, 'evenements_commissions', [
    { field: { fieldPath: 'transactionId' }, op: 'EQUAL', value: { stringValue: transactionId } },
  ]);
  return doc !== null;
}

// ── Activer abonnement salon après paiement ─────────────────
async function activerAbonnement(token: string, projectId: string, salonId: string, plan: string) {
  const duree  = 30;
  const expiry = new Date(Date.now() + duree * 24 * 60 * 60 * 1000).toISOString();
  await fsPatch(token, projectId, `salons/${salonId}`, {
    abonnementExpiry: { stringValue: expiry },
    plan:             { stringValue: plan },
  }, ['abonnementExpiry', 'plan']);
}

// ── Payout FedaPay vers Mobile Money affilié ────────────────
async function triggerPayout(
  fedapayBase: string, fedapayKey: string,
  { prenom, nom, mmNumero, mmPays, commission, affiliateCode, eventDocId }: {
    prenom: string; nom: string; mmNumero: string; mmPays: string;
    commission: number; affiliateCode: string; eventDocId: string;
  }
): Promise<string | null> {
  const res = await fetch(`${fedapayBase}/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${fedapayKey}`,
    },
    body: JSON.stringify({
      amount:      commission,
      currency:    { iso: 'XOF' },
      description: `Commission SalonPro — ${affiliateCode}`,
      reference:   eventDocId,
      customer: {
        firstname:    prenom,
        lastname:     nom,
        phone_number: { number: mmNumero, country: mmPays },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Payout FedaPay: ${JSON.stringify(err)}`);
  }
  const data = await res.json() as any;
  return data?.v1?.payout?.id ?? null;
}

// ── Traiter commission + payout automatique ─────────────────
async function processCommission(
  token: string, projectId: string, fedapayBase: string, fedapayKey: string,
  { affiliateCode, userId, plan, amount, transactionId }: {
    affiliateCode: string; userId: string; plan: string; amount: number; transactionId: string;
  }
) {
  if (!affiliateCode || affiliateCode === 'direct') return;
  if (await alreadyProcessed(token, projectId, transactionId)) {
    console.log(`[commission] Transaction ${transactionId} déjà traitée — skip`);
    return;
  }

  const affDoc = await fsQuery(token, projectId, 'affilies', [
    { field: { fieldPath: 'code'   }, op: 'EQUAL', value: { stringValue: affiliateCode } },
    { field: { fieldPath: 'statut' }, op: 'EQUAL', value: { stringValue: 'actif'       } },
  ]);
  if (!affDoc) {
    console.warn(`[commission] Affilié introuvable: ${affiliateCode}`);
    return;
  }

  const f          = affDoc.fields ?? {};
  const affilieUid = affDoc.name.split('/').pop() as string;
  const tauxPct    = Number(f.taux?.integerValue ?? 15);
  const commission = Math.round(amount * tauxPct / 100);
  const pendingNow = Number(f.commissionsPendantes?.integerValue ?? 0);
  const gainNow    = Number(f.commissionsGagnees?.integerValue   ?? 0);
  const mmNumero   = f.mobileMoneyNumero?.stringValue ?? '';
  const mmPays     = f.mobileMoneyPays?.stringValue   ?? '';
  const now        = new Date().toISOString();

  // 1. Créer l'événement commission
  const eventData = await fsPost(token, projectId, 'evenements_commissions', {
    affilieId:          { stringValue: affilieUid },
    affilieCode:        { stringValue: affiliateCode },
    clientId:           { stringValue: userId },
    plan:               { stringValue: plan },
    montantPlan:        { integerValue: String(amount) },
    taux:               { integerValue: String(tauxPct) },
    montantCommission:  { integerValue: String(commission) },
    typeEvenement:      { stringValue: 'premier_abonnement' },
    datePaiementClient: { timestampValue: now },
    statut:             { stringValue: 'en_attente' },
    transactionId:      { stringValue: transactionId },
    createdAt:          { timestampValue: now },
  }) as any;
  const eventDocId = (eventData as any).name?.split('/').pop() ?? transactionId;

  // 2. Payout automatique si Mobile Money renseigné
  let statutFinal = 'en_attente';
  let payoutId: string | null = null;

  if (mmNumero && mmPays) {
    try {
      payoutId    = await triggerPayout(fedapayBase, fedapayKey, {
        prenom: f.prenom?.stringValue ?? '',
        nom:    f.nom?.stringValue    ?? '',
        mmNumero, mmPays, commission, affiliateCode, eventDocId,
      });
      statutFinal = 'en_cours';
      console.log(`[commission] ✅ Payout ${payoutId} — ${commission} FCFA → ${mmNumero} (${mmPays})`);
    } catch (e: any) {
      statutFinal = 'echec';
      console.error(`[commission] ❌ Payout échoué (${affiliateCode}): ${e.message}`);
    }

    await fsPatch(token, projectId, `evenements_commissions/${eventDocId}`, {
      statut:          { stringValue: statutFinal },
      fedapayPayoutId: { stringValue: payoutId ?? '' },
    }, ['statut', 'fedapayPayoutId']);
  }

  // 3. Mettre à jour compteurs affilié
  const isPaid = statutFinal === 'en_cours';
  if (isPaid) {
    await fsPatch(token, projectId, `affilies/${affilieUid}`,
      { commissionsGagnees: { integerValue: String(gainNow + commission) } },
      ['commissionsGagnees'],
    );
  } else {
    await fsPatch(token, projectId, `affilies/${affilieUid}`,
      { commissionsPendantes: { integerValue: String(pendingNow + commission) } },
      ['commissionsPendantes'],
    );
  }
}

// ── Créer paiement FedaPay ──────────────────────────────────
async function createFedapayPayment(
  env: Env, token: string,
  { plan, userId, email, prenom, nom, telephone }: {
    plan: string; userId: string; email: string;
    prenom: string; nom: string; telephone: string;
  }
): Promise<{ paymentUrl: string | null; transactionId: string }> {
  const isLive      = env.ENVIRONMENT === 'live';
  const fedapayBase = isLive ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
  const planInfo    = PLANS[plan];

  // Lire refAffilie depuis Firestore (source de vérité)
  const userDoc   = await fsGet(token, env.FIREBASE_PROJECT_ID, `users/${userId}`);
  const refAffilie = (userDoc as any)?.fields?.refAffilie?.stringValue || 'direct';

  const txRes = await fetch(`${fedapayBase}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.FEDAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      description:     `SalonPro — Plan ${planInfo.nom}`,
      amount:          planInfo.prix,
      currency:        { iso: 'XOF' },
      callback_url:    env.CALLBACK_URL,
      customer: {
        firstname: prenom, lastname: nom, email,
        phone_number: { number: telephone, country: 'BJ' },
      },
      custom_metadata: { userId, plan, affiliateId: refAffilie },
    }),
  });

  if (!txRes.ok) {
    const err = await txRes.json();
    throw new Error((err as any).message || 'Erreur FedaPay');
  }

  const tx      = await txRes.json() as any;
  const txId    = tx.v1.transaction.id;
  const tokRes  = await fetch(`${fedapayBase}/transactions/${txId}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.FEDAPAY_SECRET_KEY}` },
  });
  const tokData    = await tokRes.json() as any;
  const paymentUrl = tokData.v1?.token?.token
    ? `https://checkout${isLive ? '' : '.sandbox'}.fedapay.com/?token=${tokData.v1.token.token}`
    : null;

  return { paymentUrl, transactionId: String(txId) };
}

// ── Handler principal ───────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':  '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    // ── POST /create-payment ────────────────────────────────
    if (method === 'POST' && url.pathname === '/create-payment') {
      try {
        const body     = await request.json() as any;
        const { plan, userId, email, prenom, nom, telephone } = body;
        if (!plan || !PLANS[plan] || !userId || !email) {
          return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: cors });
        }
        const token  = await getFirebaseToken(env);
        const result = await createFedapayPayment(env, token, { plan, userId, email, prenom, nom, telephone });
        return new Response(JSON.stringify(result), { status: 200, headers: cors });
      } catch (err: any) {
        console.error('[create-payment]', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
      }
    }

    // ── POST /webhook/fedapay ───────────────────────────────
    if (method === 'POST' && url.pathname === '/webhook/fedapay') {
      const rawBody = await request.text();

      // Vérifier signature
      const sigHeader = request.headers.get('x-fedapay-signature') ?? '';
      if (env.FEDAPAY_WEBHOOK_SECRET) {
        const valid = await verifyFedapaySignature(rawBody, sigHeader, env.FEDAPAY_WEBHOOK_SECRET);
        if (!valid) return new Response('Signature invalide', { status: 401 });
      }

      try {
        const payload   = JSON.parse(rawBody) as any;
        const eventName = payload.name ?? payload.event;

        if (eventName !== 'transaction.approved') {
          return new Response('ignored', { status: 200 });
        }

        const tx      = payload.data?.object ?? payload.transaction ?? {};
        const meta    = tx.custom_metadata ?? {};
        const txId    = String(tx.id ?? '');
        const amount  = Number(tx.amount ?? 0);
        const userId  = meta.userId      ?? '';
        const plan    = meta.plan        ?? '';
        const affCode = meta.affiliateId ?? 'direct';
        const salonId = meta.salonId     ?? '';

        if (!txId || !userId) {
          return new Response('Données incomplètes', { status: 400 });
        }

        const isLive      = env.ENVIRONMENT === 'live';
        const fedapayBase = isLive ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
        const token       = await getFirebaseToken(env);

        // Activer l'abonnement du salon
        if (salonId && plan) {
          await activerAbonnement(token, env.FIREBASE_PROJECT_ID, salonId, plan);
        }

        // Traiter la commission affilié + payout
        await processCommission(token, env.FIREBASE_PROJECT_ID, fedapayBase, env.FEDAPAY_SECRET_KEY, {
          affiliateCode: affCode, userId, plan, amount, transactionId: txId,
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
      } catch (err: any) {
        console.error('[webhook/fedapay]', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
