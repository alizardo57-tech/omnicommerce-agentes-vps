require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const apiRoutes = require('./routes/api');
const authAdminRoutes = require('./routes/authAdmin');
const { garantirBaseSaaS } = require('./db/tenants');
const { rodarRotinaDiariaAgentes } = require('./agents/orquestrador');
const { iniciarMonitorHibrido } = require('./services/hibrido');
const { rodarReativacaoInativos15Dias } = require('./services/reativacao');

const app = express();
const PORT = Number(process.env.PORT || 3000);

garantirBaseSaaS();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', authAdminRoutes);
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Monitor Híbrido: testa latência da VPS a cada 10s e chaveia para LOCAL se houver queda/instabilidade
iniciarMonitorHibrido();

// Rotina diária automática às 22h00 (Fernanda CFO + Carlos Estoque)
cron.schedule('0 22 * * *', () => {
  rodarRotinaDiariaAgentes().catch(err => {
    console.error('Erro na rotina diária:', err.message);
  });
});

// Reativação automática às 11h00 para clientes inativos há 15 dias ou mais
cron.schedule('0 11 * * *', () => {
  rodarReativacaoInativos15Dias(15).catch(err => {
    console.error('Erro na reativação 15 dias:', err.message);
  });
});

app.listen(PORT, () => {
  console.log(`OmniCommerce 11 Agentes rodando na porta ${PORT}`);
});
