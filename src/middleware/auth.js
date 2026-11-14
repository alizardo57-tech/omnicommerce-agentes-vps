const crypto = require('crypto');
const { garantirBaseSaaS } = require('../db/tenants');

const AUTH_SECRET = process.env.AUTH_SECRET || 'omnicommerce_jwt_secret_2026';

function gerarToken(payload) {
  const dados = { ...payload, exp: Date.now() + 12 * 60 * 60 * 1000 };
  const corpo = Buffer.from(JSON.stringify(dados)).toString('base64url');
  const assinatura = crypto.createHmac('sha256', AUTH_SECRET).update(corpo).digest('base64url');
  return `${corpo}.${assinatura}`;
}

function validarToken(token) {
  const [corpo, assinatura] = String(token || '').split('.');
  if (!corpo || !assinatura) return null;
  const esperado = crypto.createHmac('sha256', AUTH_SECRET).update(corpo).digest('base64url');
  if (assinatura.length !== esperado.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado))) return null;
  const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
  if (!dados.exp || Date.now() > dados.exp) return null;
  return dados;
}

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = validarToken(token);
  if (!payload) {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login.' });
  }
  req.usuario = payload;
  next();
}

function exigirSuperAdmin(req, res, next) {
  if (!req.usuario || req.usuario.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ erro: 'Acesso restrito ao Administrador Geral.' });
  }
  next();
}

function exigirModulo(nomeModulo) {
  return (req, res, next) => {
    if (req.usuario?.role === 'SUPER_ADMIN') return next();
    const db = garantirBaseSaaS();
    const tenant = db.tenants.find(t => t.id === req.usuario?.tenantId);
    if (!tenant || !tenant.ativo) {
      return res.status(403).json({ erro: 'Conta da loja inativa ou não encontrada.' });
    }
    if (!tenant.modulos || !tenant.modulos[nomeModulo]) {
      return res.status(403).json({ erro: `Módulo "${nomeModulo}" não habilitado para esta loja.` });
    }
    next();
  };
}

module.exports = { gerarToken, validarToken, autenticar, exigirSuperAdmin, exigirModulo };
