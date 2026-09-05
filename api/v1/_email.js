function configured(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendEmail({ to, subject, html, idempotencyKey }) {
  const apiKey = configured('RESEND_API_KEY');
  const from = configured('TRANSACTIONAL_EMAIL_FROM') || 'Mursaltheorie <noreply@updates.mursaltheorie.nl>';
  if (!apiKey) return { sent: false, reason: 'not_configured' };
  if (!to) return { sent: false, reason: 'missing_recipient' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.id) {
    console.error('Transactional email failed', { status: response.status, name: payload?.name });
    return { sent: false, reason: 'provider_error' };
  }
  return { sent: true, id: payload.id };
}

export function purchaseConfirmationEmail({ email, orderId, description, amount, consentText, appUrl }) {
  const activationUrl = `${appUrl}/learn5?payment=return`;
  return sendEmail({
    to: email,
    subject: 'Bevestig en start je Mursaltheorie-toegang',
    idempotencyKey: `purchase-confirmation-${orderId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17131f;line-height:1.6">
      <h1>Je betaling is ontvangen</h1>
      <p><strong>${escapeHtml(description)}</strong><br>€${escapeHtml(amount)} · eenmalig · geen automatische verlenging</p>
      <p>Je hebt vóór betaling verklaard:</p>
      <blockquote style="border-left:4px solid #6b42dc;margin:16px 0;padding:10px 16px;background:#f7f4fb">${escapeHtml(consentText)}</blockquote>
      <p>Je toegang is nog niet gestart. Open Mursaltheorie en kies <strong>Start mijn 30 dagen toegang</strong>. Op dat moment begint de levering en vervalt het wettelijke herroepingsrecht voor deze digitale inhoud.</p>
      <p><a href="${escapeHtml(activationUrl)}" style="display:inline-block;background:#6b42dc;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">Naar mijn aankoop</a></p>
      <p>Wil je vóór activatie van de koop af? Gebruik dan in je account de knop <strong>Koop ongedaan maken</strong> of mail naar <a href="mailto:mursalsadat@proton.me">mursalsadat@proton.me</a>.</p>
      <hr><p style="font-size:13px;color:#6e6877">Mursal Taalcoach · KvK 42145630</p>
    </div>`
  });
}

export function withdrawalConfirmationEmail({ email, orderId, description, requestedAt }) {
  return sendEmail({
    to: email,
    subject: 'Bevestiging: aankoop Mursaltheorie ongedaan gemaakt',
    idempotencyKey: `withdrawal-confirmation-${orderId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17131f;line-height:1.6">
      <h1>Je verzoek is ontvangen</h1>
      <p>De aankoop <strong>${escapeHtml(description)}</strong> is op ${escapeHtml(requestedAt)} ongedaan gemaakt.</p>
      <p>Orderkenmerk: ${escapeHtml(orderId)}</p>
      <p>Een verschuldigde terugbetaling wordt via de oorspronkelijke betaalmethode afgehandeld. Heb je vragen? Mail <a href="mailto:mursalsadat@proton.me">mursalsadat@proton.me</a>.</p>
      <hr><p style="font-size:13px;color:#6e6877">Mursal Taalcoach · KvK 42145630</p>
    </div>`
  });
}
