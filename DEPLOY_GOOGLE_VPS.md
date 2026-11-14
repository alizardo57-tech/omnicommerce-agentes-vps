# Deploy na Google Cloud VPS (Compute Engine)

Passo a passo exato para subir os **11 Agentes + Evolution API (WhatsApp) + PDV Web** na sua VM do Google Cloud.

## 1. Criar a Máquina Virtual (VM) no Google Cloud
1. Acesse o Console do Google Cloud -> **Compute Engine** -> **Instâncias de VM** -> **Criar instância**.
2. **Região:** `southamerica-east1 (São Paulo)` (menor latência para WhatsApp no Brasil).
3. **Tipo de máquina:** `e2-small` (2 vCPU, 2 GB RAM — suficiente para API + Evolution API) ou `e2-medium` (4 GB RAM se for atender várias lojas).
4. **Sistema Operacional:** Ubuntu 22.04 LTS ou 24.04 LTS (disco 20–30 GB).
5. **Firewall:** Marque Permitir tráfego HTTP e HTTPS. Depois, em **Rede VPC -> Regras de Firewall**, libere TCP `3000` (API + PDV) e `8080` (Evolution API), ou use Nginx/Caddy com HTTPS.

## 2. Instalar Docker na VPS (via SSH)
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Enviar o projeto e configurar o `.env`
```bash
cd ~/omnicommerce-agentes-vps
cp .env.example .env
nano .env
```
Preencha no `.env`:
- `SETOR_INICIAL=` (`pizzaria`, `piercing`, `acougue`, `rotisseria`, `barbearia`, `petshop`, `tintas`, `japones`, `bebidas`, `autopecas`)
- `NOME_LOJA=`, `CIDADE_LOJA=`, `DONO_WHATSAPP=55...`
- `GEMINI_API_KEY=` (ou `OPENAI_API_KEY=` com `LLM_PROVIDER=openai`)
- `ADMIN_PIN=2026` (troque para seu PIN secreto)

## 4. Subir os 11 Agentes + WhatsApp
```bash
docker compose up -d --build
docker compose logs -f api
```

## 5. Conectar o WhatsApp da Loja (QR Code)
1. Crie a instância na Evolution API (`http://IP_DA_VPS:8080`) com nome `loja_principal` e leia o **QR Code** no WhatsApp Business do cliente.
2. Configure o Webhook da instância para apontar para:
   `http://api:3000/api/webhook/whatsapp` (evento `MESSAGES_UPSERT`).

## 6. Testar e Trocar de Setor pelo Admin
- **Healthcheck:** `http://IP_DA_VPS:3000/api/health`
- **PDV Web:** `http://IP_DA_VPS:3000/` (use `Ctrl + Shift + A` para abrir o seletor Admin)
- **Executar qualquer um dos 11 agentes sob demanda:**
  `POST http://IP_DA_VPS:3000/api/agentes/camila/executar` (ou `fernanda`, `carlos`, `rafael`, `lucas`, `bia`, `gustavo`, `rodrigo`, `juliana`, `miller`, `fontana`).
- **Trocar setor na VPS via API (Admin):**
  `POST http://IP_DA_VPS:3000/api/admin/setor` com `{ "pin": "2026", "setor": "pizzaria", "nomeLoja": "Forno Nobre" }`.
