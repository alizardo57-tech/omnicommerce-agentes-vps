const { lerDb, salvarDb } = require('../db/store');

const estadoHibrido = {
  vpsUrl: (process.env.VPS_URL || '').replace(/\/$/, ''),
  modoAtivo: process.env.VPS_URL ? 'VPS' : 'LOCAL',
  latenciaMs: null,
  falhasSeguidas: 0,
  sucessosSeguidos: 0,
  ultimoCheck: null,
  motivo: process.env.VPS_URL ? 'Aguardando verificação' : 'VPS_URL não configurada (rodando local)'
};

const TIMEOUT_MS = Number(process.env.VPS_TIMEOUT_MS || 2500);

async function verificarSaudeVps() {
  if (!estadoHibrido.vpsUrl) {
    estadoHibrido.modoAtivo = 'LOCAL';
    estadoHibrido.ultimoCheck = new Date().toISOString();
    return estadoHibrido;
  }

  const inicio = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(`${estadoHibrido.vpsUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    const latencia = Date.now() - inicio;
    estadoHibrido.latenciaMs = latencia;
    estadoHibrido.ultimoCheck = new Date().toISOString();

    if (!resp.ok || latencia > TIMEOUT_MS) {
      throw new Error(`Instabilidade (HTTP ${resp.status}, ${latencia}ms)`);
    }

    estadoHibrido.falhasSeguidas = 0;
    estadoHibrido.sucessosSeguidos += 1;

    if (estadoHibrido.modoAtivo !== 'VPS' && estadoHibrido.sucessosSeguidos >= 2) {
      estadoHibrido.modoAtivo = 'VPS';
      estadoHibrido.motivo = `VPS estável (${latencia}ms)`;
      await sincronizarPedidosPendentes();
    } else if (estadoHibrido.modoAtivo === 'VPS') {
      estadoHibrido.motivo = `VPS online (${latencia}ms)`;
    }
  } catch (err) {
    clearTimeout(timer);
    estadoHibrido.latenciaMs = null;
    estadoHibrido.sucessosSeguidos = 0;
    estadoHibrido.falhasSeguidas += 1;
    estadoHibrido.ultimoCheck = new Date().toISOString();

    if (estadoHibrido.falhasSeguidas >= 2 && estadoHibrido.modoAtivo !== 'LOCAL') {
      estadoHibrido.modoAtivo = 'LOCAL';
      estadoHibrido.motivo = `Fallback automático: ${err.name === 'AbortError' ? 'Timeout/Internet lenta' : err.message}`;
    }
  }

  return estadoHibrido;
}

async function sincronizarPedidosPendentes() {
  if (!estadoHibrido.vpsUrl || estadoHibrido.modoAtivo !== 'VPS') return { sincronizados: 0 };

  const db = lerDb();
  const pendentes = db.pedidos.filter(p => p.sincronizadoVps === false);
  if (pendentes.length === 0) return { sincronizados: 0 };

  try {
    const resp = await fetch(`${estadoHibrido.vpsUrl}/api/pedidos/sincronizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidos: pendentes })
    });
    if (resp.ok) {
      db.pedidos.forEach(p => {
        if (p.sincronizadoVps === false) p.sincronizadoVps = true;
      });
      salvarDb(db);
      return { sincronizados: pendentes.length };
    }
  } catch (err) {
    console.error('Falha ao sincronizar pedidos pendentes:', err.message);
  }
  return { sincronizados: 0 };
}

function iniciarMonitorHibrido() {
  verificarSaudeVps();
  setInterval(verificarSaudeVps, 10000);
}

function obterEstadoHibrido() {
  const db = lerDb();
  const pendentes = db.pedidos.filter(p => p.sincronizadoVps === false).length;
  return { ...estadoHibrido, pedidosPendentesSync: pendentes };
}

module.exports = { iniciarMonitorHibrido, obterEstadoHibrido, verificarSaudeVps, sincronizarPedidosPendentes };
