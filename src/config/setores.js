const SETORES = {
  pizzaria: {
    nomePadrao: 'Pizzaria Forno Nobre & Delivery',
    produtoFoco: 'pizzas meio-a-meio, bordas recheadas e combos',
    estoqueCritico: 'muçarela, calabresa, massa e blend bovino',
    entrega: 'motoboy por bairro',
    cicloReativacaoDias: 15,
    compliance: 'NFC-e e boas práticas de manipulação de alimentos',
    produtosIniciais: [
      { id: 301, nome: 'Pizza G 1/2 Calabresa + 1/2 Muçarela', preco: 64.9, custo: 19.8, estoque: 85 },
      { id: 302, nome: 'Pizza G Frango c/ Catupiry Original', preco: 74.9, custo: 24.5, estoque: 60 },
      { id: 303, nome: 'Adicional Borda Recheada Catupiry', preco: 16.0, custo: 5.2, estoque: 110 },
      { id: 304, nome: 'Combo Família (2 Pizzas G + Refri 2L)', preco: 129.9, custo: 43.0, estoque: 40 }
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
      { id: 101, nome: 'Labret Titânio G23 + Aplicação', preco: 130.0, custo: 18.0, estoque: 65 },
      { id: 102, nome: 'Argola Clicker Titânio PVD Dourado', preco: 150.0, custo: 24.0, estoque: 42 },
      { id: 103, nome: 'Soro Estéril Pós-Perfuração 100ml', preco: 28.0, custo: 8.0, estoque: 95 }
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
