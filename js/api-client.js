/** Parse seguro de respostas JSON das APIs Vercel */
async function apiFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').substring(0, 100);
    throw new Error(
      'Resposta inválida do servidor. ' +
        (preview.startsWith('A server') ? 'Erro interno na Vercel.' : preview)
    );
  }

  if (!res.ok || data.success === false || (data.success !== true && data.error)) {
    const msg =
      data.error ||
      data.message ||
      (data.details && typeof data.details === 'object'
        ? JSON.stringify(data.details)
        : null) ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
