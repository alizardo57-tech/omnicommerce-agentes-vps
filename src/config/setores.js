const SETORES = {
  pizzaria: {
    nomePadrao: 'Pizzaria Forno Nobre & Delivery',
    produtoFoco: 'pizzas meio-a-meio, bordas recheadas e combos',
    estoqueCritico: 'muçarela, calabresa, massa e blend bovino',
    entrega: 'motoboy por bairro',
    cicloReativacaoDias: 15,
    compliance: 'NFC-e e boas práticas de manipulação de alimentos',
    produtosIniciais: [
      { id: 301, nome: 'Pizza G 1/2 Calabresa + 1/2 Muçarela', preco: 64.9, custo: 19.8, estoque: 85, imagem: '/img/produtos/pizza-calabresa.svg' },
      { id: 302, nome: 'Pizza G Frango c/ Catupiry Original', preco: 74.9, custo: 24.5, estoque: 60, imagem: '/img/produtos/pizza-frango.svg' },
      { id: 303, nome: 'Pizza G Calabresa Acebolada Tradicional', preco: 62.9, custo: 18.5, estoque: 75, imagem: '/img/produtos/pizza-calabresa.svg' },
      { id: 304, nome: 'Pizza G Quatro Queijos (Muçarela, Provolone, Parmesão e Catupiry)', preco: 76.9, custo: 26.0, estoque: 55, imagem: '/img/produtos/pizza-queijo.svg' },
      { id: 305, nome: 'Pizza G Portuguesa Completa', preco: 72.9, custo: 23.0, estoque: 50, imagem: '/img/produtos/pizza-calabresa.svg' },
      { id: 306, nome: 'Pizza G Marguerita c/ Manjericão Fresco', preco: 64.9, custo: 19.0, estoque: 65, imagem: '/img/produtos/pizza-queijo.svg' },
      { id: 307, nome: 'Pizza G Doce Chocolate ao Leite c/ Morango', preco: 69.9, custo: 22.0, estoque: 40, imagem: '/img/produtos/pizza-doce.svg' },
      { id: 308, nome: 'Adicional Borda Recheada Catupiry', preco: 16.0, custo: 5.2, estoque: 110, imagem: '/img/produtos/borda.svg' },
      { id: 309, nome: 'Adicional Borda Recheada Cheddar Cremoso', preco: 16.0, custo: 5.5, estoque: 90, imagem: '/img/produtos/borda.svg' },
      { id: 310, nome: 'Combo Família (2 Pizzas G + Refri 2L)', preco: 129.9, custo: 43.0, estoque: 40, imagem: '/img/produtos/combo-pizza.svg' },
      { id: 311, nome: 'Coca-Cola Original Pet 2L Gelada', preco: 14.0, custo: 7.5, estoque: 95, imagem: '/img/produtos/refri-2l.svg' },
      { id: 312, nome: 'Guaraná Antarctica Pet 2L Gelado', preco: 12.0, custo: 6.5, estoque: 80, imagem: '/img/produtos/refri-2l.svg' }
    ]
  },
  piercing: {
    nomePadrao: 'Studio & Boutique VIP Piercing',
    produtoFoco: 'joias em Titânio G23 e perfurações assépticas',
    estoqueCritico: 'labrets, argolas clicker e soro fisiológico',
    entrega: 'agendamento em estúdio / envio de joias',
    cicloReativacaoDias: 30,
    compliance: 'Termo ANVISA assinado e verificação de idade mínima',
    produtosIniciais: [
      { id: 101, nome: 'Labret Titânio G23 (Tragus / Hélix / Lóbulo) + Aplicação', preco: 130.0, custo: 18.0, estoque: 65, imagem: '/img/produtos/101.jpg' },
      { id: 102, nome: 'Labret Titânio Zircônia Cravejada (Conch / Flat) + Aplicação', preco: 165.0, custo: 28.0, estoque: 38, imagem: '/img/produtos/102.jpg' },
      { id: 103, nome: 'Nostril Titânio G23 (Aba Nasal) + Aplicação', preco: 140.0, custo: 20.0, estoque: 50, imagem: '/img/produtos/103.jpg' },
      { id: 104, nome: 'Ferradura / Captive Titânio (Septo / Daith) + Aplicação', preco: 155.0, custo: 22.0, estoque: 34, imagem: '/img/produtos/104.jpg' },
      { id: 105, nome: 'Banana Bell Titânio G23 (Umbigo) + Aplicação', preco: 160.0, custo: 24.0, estoque: 40, imagem: '/img/produtos/105.jpg' },
      { id: 106, nome: 'Microbell Curvo Titânio (Sobrancelha / Rook) + Aplicação', preco: 150.0, custo: 21.0, estoque: 29, imagem: '/img/produtos/106.jpg' },
      { id: 107, nome: 'Barbell Reto Titânio G23 (Língua / Industrial) + Aplicação', preco: 170.0, custo: 25.0, estoque: 22, imagem: '/img/produtos/107.jpg' },
      { id: 108, nome: 'Argola Clicker Titânio PVD Dourado (Troca / Cicatrizado)', preco: 150.0, custo: 24.0, estoque: 42, imagem: '/img/produtos/108.jpg' },
      { id: 109, nome: 'Argola Clicker Cravejada Titânio (Conch / Septo / Daith)', preco: 190.0, custo: 35.0, estoque: 26, imagem: '/img/produtos/109.svg' },
      { id: 110, nome: 'Topo Opala Branca / Rosa Titânio G23 (Avulso)', preco: 95.0, custo: 16.0, estoque: 45, imagem: '/img/produtos/110.jpg' },
      { id: 111, nome: 'Joia Banana Umbigo Zircônia Dupla Titânio (Avulsa)', preco: 120.0, custo: 22.0, estoque: 30, imagem: '/img/produtos/111.svg' },
      { id: 112, nome: 'Troca de Joia + Esterilização em Autoclave', preco: 45.0, custo: 6.0, estoque: 99, imagem: '/img/produtos/112.svg' },
      { id: 113, nome: 'Soro Estéril Pós-Perfuração 100ml', preco: 28.0, custo: 8.0, estoque: 95, imagem: '/img/produtos/113.svg' },
      { id: 114, nome: 'Spray Antisséptico Cicatrizante Piercing 60ml', preco: 42.0, custo: 14.0, estoque: 60, imagem: '/img/produtos/114.svg' }
    ]
  },
  acougue: {
    nomePadrao: 'Boutique de Carnes Prime',
    produtoFoco: 'cortes bovinos, kits churrasco e carvão',
    estoqueCritico: 'rendimento pós-desossa e validade de cortes',
    entrega: 'retirada balcão e entrega refrigerada',
    cicloReativacaoDias: 7,
    compliance: 'balança aferida, lote/SIF e NFC-e',
    produtosIniciais: [
      { id: 201, nome: 'Picanha Bovina Maturada (Kg)', preco: 89.9, custo: 58.0, estoque: 45 },
      { id: 202, nome: 'Kit Churrasco 5 Pessoas', preco: 149.9, custo: 92.0, estoque: 20 }
    ]
  },
  rotisseria: {
    nomePadrao: 'Rotisseria Sabor de Domingo',
    produtoFoco: 'frango assado, costela e massas por fornada',
    estoqueCritico: 'aves e carnes por fornada dominical',
    entrega: 'reserva de horário e entrega bairro',
    cicloReativacaoDias: 7,
    compliance: 'validade de manipulados e NFC-e',
    produtosIniciais: [
      { id: 501, nome: 'Frango Assado na Brasa', preco: 49.9, custo: 19.5, estoque: 32 },
      { id: 502, nome: 'Costela Suína Barbecue (Kg)', preco: 68.0, custo: 27.0, estoque: 25 }
    ]
  },
  barbearia: {
    nomePadrao: 'Barber Club & Estilo Clássico',
    produtoFoco: 'cortes, barboterapia e planos mensais',
    estoqueCritico: 'pomadas, lâminas e bebidas do bar',
    entrega: 'agenda por profissional',
    cicloReativacaoDias: 21,
    compliance: 'comissão profissional e NFS-e',
    produtosIniciais: [
      { id: 901, nome: 'Corte Degradê / Fade', preco: 55.0, custo: 5.0, estoque: 99 },
      { id: 902, nome: 'Combo Corte + Barboterapia', preco: 95.0, custo: 10.0, estoque: 99 }
    ]
  },
  petshop: {
    nomePadrao: 'Mundo Pet Clínica & Banho e Tosa',
    produtoFoco: 'banho/tosa, rações 15kg e antipulgas',
    estoqueCritico: 'sacaria de ração e validade de vacinas',
    entrega: 'táxi dog e entrega rápida',
    cicloReativacaoDias: 21,
    compliance: 'ficha do pet/vacinas e NFC-e',
    produtosIniciais: [
      { id: 801, nome: 'Banho & Tosa Higiênica (Pequeno)', preco: 75.0, custo: 18.0, estoque: 99 },
      { id: 802, nome: 'Ração Golden Adultos 15kg', preco: 169.9, custo: 124.0, estoque: 30 }
    ]
  },
  tintas: {
    nomePadrao: 'ShopCor Tintas & Acabamentos',
    produtoFoco: 'tintas 18L, massas e acessórios de pintura',
    estoqueCritico: 'bases tintométricas e itens giro zero 60d',
    entrega: 'rota de caminhão/utilitário em obras',
    cicloReativacaoDias: 45,
    compliance: 'NF-e B2B/obra e CFOP correto',
    produtosIniciais: [
      { id: 601, nome: 'Tinta Acrílica Fosca Branco 18L', preco: 389.9, custo: 245.0, estoque: 28 },
      { id: 602, nome: 'Massa Corrida PVA 25kg', preco: 84.9, custo: 52.0, estoque: 45 }
    ]
  },
  japones: {
    nomePadrao: 'Kuroki Sushi Bar & Delivery',
    produtoFoco: 'rodízio, combinados e temakis',
    estoqueCritico: 'rendimento de salmão fresco e insumos',
    entrega: 'delivery próprio sem taxa de app',
    cicloReativacaoDias: 15,
    compliance: 'boas práticas de pescado cru e NFC-e',
    produtosIniciais: [
      { id: 701, nome: 'Combinado Salmão Premium 30 Peças', preco: 119.9, custo: 42.0, estoque: 40 },
      { id: 702, nome: 'Temaki Salmão Filadélfia', preco: 36.9, custo: 12.5, estoque: 65 }
    ]
  },
  bebidas: {
    nomePadrao: 'Distribuidora Express & Gelada',
    produtoFoco: 'fardos, destilados, gelo e carvão',
    estoqueCritico: 'cervejas de giro alto e vasilhames',
    entrega: 'entrega noturna por bairro',
    cicloReativacaoDias: 10,
    compliance: 'proibida venda para menores de 18 anos e NFC-e',
    produtosIniciais: [
      { id: 251, nome: 'Fardo Heineken 350ml (12un)', preco: 69.9, custo: 49.0, estoque: 120 },
      { id: 252, nome: 'Saco de Gelo Filtrado 5kg', preco: 14.0, custo: 4.5, estoque: 80 }
    ]
  },
  autopecas: {
    nomePadrao: 'AutoPeças & Motopeças Express',
    produtoFoco: 'peças por modelo/ano do veículo',
    estoqueCritico: 'itens de troca rápida e giro zero',
    entrega: 'motoboy para oficinas mecânicas',
    cicloReativacaoDias: 60,
    compliance: 'NCM/ST autopeças e garantia',
    produtosIniciais: [
      { id: 451, nome: 'Kit Óleo 5W30 + Filtro', preco: 189.9, custo: 112.0, estoque: 40 },
      { id: 452, nome: 'Jogo Pastilha de Freio Dianteira', preco: 119.0, custo: 64.0, estoque: 25 }
    ]
  }
};

module.exports = { SETORES };
