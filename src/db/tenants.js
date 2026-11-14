const crypto = require('crypto');
const { lerDb, salvarDb } = require('../db/store');
const { SETORES } = require('../config/setores');

function hashSenha(senha) {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.scryptSync(String(senha), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verificarSenha(senha, armazenado) {
  const [salt, hashOriginal] = String(armazenado || '').split(':');
  if (!salt || !hashOriginal) return false;
  const hashAtual = crypto.scryptSync(String(senha), salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashOriginal, 'hex'), Buffer.from(hashAtual, 'hex'));
}

function garantirBaseSaaS() {
  const db = lerDb();
  let mudou = false;

  if (!Array.isArray(db.tenants) || db.tenants.length === 0) {
    db.tenants = [
      {
        id: 'cli_fornonobre',
        nome: 'Pizzaria Forno Nobre',
        setor: 'pizzaria',
        cidade: 'Centro',
        ativo: true,
        instrucoesCamila: 'Atenda com simpatia e agilidade. Sempre ofereça borda recheada de Catupiry e refrigerante 2L. Informe prazo médio de entrega de 35 minutos.',
        modulos: { pdv: true, erp: true, agenda: false, whatsapp_ia: true, agentes11: false },
        criadoEm: new Date().toISOString()
      },
      {
        id: 'cli_studiovip',
        nome: 'Studio VIP Piercing',
        setor: 'piercing',
        cidade: 'Jardins',
        ativo: true,
        instrucoesCamila: 'Atendimento tranquilo e acolhedor. Só fale de autoclave, titânio G23 ou Termo ANVISA se o cliente perguntar. Quando o cliente perguntar de horário ou quiser agendar: diga de forma natural (ex: "Só um minutinho que vou olhar aqui na agenda..."), sugira horários vagos e explique com calma que para reservar o horário tem uma taxa de R$ 30,00 via PIX, que é abatida do valor final no dia do atendimento.',
        modulos: { pdv: true, erp: true, agenda: true, whatsapp_ia: true, agentes11: true },
        criadoEm: new Date().toISOString()
      }
    ];
    mudou = true;
  }

  if (!Array.isArray(db.usuarios) || db.usuarios.length === 0) {
    db.usuarios = [
      {
        id: 'usr_superadmin',
        nome: 'Administrador Geral',
        email: 'admin@omnicommerce.com',
        senhaHash: hashSenha(process.env.SUPER_ADMIN_PASS || 'admin2026'),
        role: 'SUPER_ADMIN',
        tenantId: null
      },
      {
        id: 'usr_fornonobre',
        nome: 'Gerente Forno Nobre',
        email: 'fornonobre@loja.com',
        senhaHash: hashSenha('123456'),
        role: 'CLIENT_ADMIN',
        tenantId: 'cli_fornonobre'
      },
      {
        id: 'usr_studiovip',
        nome: 'Gerente Studio VIP',
        email: 'studiovip@loja.com',
        senhaHash: hashSenha('123456'),
        role: 'CLIENT_ADMIN',
        tenantId: 'cli_studiovip'
      }
    ];
    mudou = true;
  }

  if (mudou) salvarDb(db);
  return db;
}

function criarNovoCliente({ nome, setor, cidade, emailAdmin, senhaAdmin, modulos }) {
  if (!SETORES[setor]) throw new Error(`Setor inválido: ${setor}`);
  const db = garantirBaseSaaS();
  const emailNorm = String(emailAdmin || '').trim().toLowerCase();
  if (!emailNorm || !senhaAdmin) throw new Error('E-mail e senha do cliente são obrigatórios');
  if (db.usuarios.some(u => u.email === emailNorm)) throw new Error('Já existe usuário com este e-mail');

  const tenantId = `cli_${Date.now().toString(36)}`;
  const novoTenant = {
    id: tenantId,
    nome: nome || SETORES[setor].nomePadrao,
    setor,
    cidade: cidade || 'Centro',
    ativo: true,
    modulos: {
      pdv: modulos?.pdv !== false,
      erp: modulos?.erp !== false,
      agenda: Boolean(modulos?.agenda),
      whatsapp_ia: Boolean(modulos?.whatsapp_ia),
      agentes11: Boolean(modulos?.agentes11)
    },
    criadoEm: new Date().toISOString()
  };

  const novoUsuario = {
    id: `usr_${Date.now().toString(36)}`,
    nome: `Admin ${novoTenant.nome}`,
    email: emailNorm,
    senhaHash: hashSenha(senhaAdmin),
    role: 'CLIENT_ADMIN',
    tenantId
  };

  db.tenants.push(novoTenant);
  db.usuarios.push(novoUsuario);
  salvarDb(db);
  return { tenant: novoTenant, usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role } };
}

module.exports = { hashSenha, verificarSenha, garantirBaseSaaS, criarNovoCliente };
