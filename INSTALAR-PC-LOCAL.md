# Como instalar o Sistema da Pizzaria no PC Local (Windows)

## 1. Pré-requisito único
- Instale o **Node.js LTS** (versão 20 ou superior) no PC da pizzaria: https://nodejs.org

## 2. Copiar o sistema para o PC da pizzaria
Escolha **uma** das duas formas:
- **Via Pen Drive / Pasta:** copie a pasta inteira `omnicommerce-agentes-vps` para `C:\BellaPizza\` (não precisa copiar `node_modules`).
- **Via Git (se tiver Git no PC):**
  ```bash
  git clone https://github.com/alizardo57-tech/omnicommerce-agentes-vps.git
  ```

## 3. Configurar a chave da IA (Camila)
1. Na pasta do projeto, abra o arquivo `.env` (ou copie `.env.example` para `.env`).
2. Preencha `GEMINI_API_KEY=...` com a sua chave do Google AI Studio.
3. *(Opcional — WhatsApp oficial)* Preencha `EVOLUTION_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE` quando conectar o WhatsApp da loja.

## 4. Iniciar com 1 clique
- Dê **duplo clique** em **`INICIAR-PIZZARIA.bat`**.
- Na primeira vez ele instala os pacotes automaticamente e já abre o painel no navegador:
  - **Painel (PDV 1/2 a 1/2 + ERP + Alerta de Pedido + Cupom 2 Vias):** `http://localhost:3000/app.html?loja=cli_bellapizza`
  - **Login:** `bellapizza@loja.com` | **Senha:** `123456`
  - **Loja Online (Cardápio):** `http://localhost:3000/loja.html?loja=cli_bellapizza`
  - **Chat Camila:** `http://localhost:3000/demo-chat.html?loja=cli_bellapizza`

## 5. Acessar de outro PC/celular no Wi-Fi da pizzaria
1. No PC principal, abra o Prompt de Comando e digite `ipconfig` para ver o **Endereço IPv4** (ex.: `192.168.1.50`).
2. No celular ou tablet da cozinha/balcão (no mesmo Wi-Fi), abra:
   `http://192.168.1.50:3000/app.html?loja=cli_bellapizza`

## 6. Onde ficam salvos os dados
- Todos os pedidos, clientes, cashback e estoque ficam salvos localmente na pasta `data/` (em disco permanente, não somem ao reiniciar o PC).
