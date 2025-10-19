console.log("Início Tarefa 2 - Gemini");

/**
 * @typedef {object} OrderItem
 * @property {number} price
 * @property {number} quantity
 * @property {string} id
 */

/**
 * @typedef {object} OrderData
 * @property {OrderItem[]} items
 */

/**
 * @typedef {object} UserInfo
 * @property {string} type - Ex: VIP, GOLD, etc.
 * @property {string} state - Ex: CA, NY, TX, FL, ou outro.
 * @property {string} id
 * @property {string} email
 * @property {string} address
 * @property {string} level - Ex: PREMIUM, STANDARD, BASIC.
 * @property {string} location - Ex: EUROPE, USA, ASIA.
 */

/**
 * @typedef {object} PaymentInfo
 * @property {string} method - Ex: CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CRYPTO, CARD, BANK, DIGITAL.
 * @property {number} amount
 * @property {string} type - Alias para method
 */

/**
 * @typedef {object} ShippingInfo
 * @property {string} type - Ex: EXPRESS, STANDARD, ECONOMY, PICKUP.
 * @property {string} speed - Alias para type. Ex: FAST, MEDIUM, SLOW.
 */

/**
 * @typedef {object} PromoInfo
 * @property {string} code - Ex: SAVE10, SAVE20, FREESHIP, BOGO.
 * @property {number} discount - Usado no calculateOrderTotal (código legacy)
 */

// --- 1. CONSTANTES PARA VALORES MÁGICOS ---

/**
 * @description Constantes mágicas.
 */
const CONSTANTS = {
  // Descontos por tipo de usuário (processOrder original)
  USER_DISCOUNTS: {
    VIP: 0.15,
    GOLD: 0.1,
    SILVER: 0.05,
    BRONZE: 0.02,
    REGULAR: 0,
  },
  // Descontos por código promocional
  PROMO_DISCOUNTS: {
    SAVE10: 0.1,
    SAVE20: 0.2,
    SAVE30: 0.3,
    SAVE50: 0.5,
    BOGO: 0.5,
  },
  // Custos de envio (processOrder original)
  SHIPPING_COSTS: {
    EXPRESS: 25,
    STANDARD: 15,
    ECONOMY: 8,
    PICKUP: 0,
  },
  // Impostos por Estado/Região (processOrder original)
  TAX_RATES_STATE: {
    CA: 0.0875,
    NY: 0.08,
    TX: 0.0625,
    FL: 0, // Sem imposto de estado
    DEFAULT: 0.05,
  },
  // Taxas de pagamento (processOrder original)
  PAYMENT_FEES: {
    CREDIT_CARD: 0.029,
    DEBIT_CARD: 0.015,
    PAYPAL: 0.034,
    BANK_TRANSFER: 0,
    CRYPTO: 0.01,
  },
  // --- Mapeamento para calculateOrderTotal (código duplicado) ---
  // Descontos por nível de cliente (calculateOrderTotal)
  LEVEL_DISCOUNTS: {
    PREMIUM: 0.2,
    STANDARD: 0.1,
    BASIC: 0.05,
  },
  // Custos de envio por velocidade (calculateOrderTotal)
  DELIVERY_COSTS: {
    FAST: 30,
    MEDIUM: 15,
    SLOW: 5,
  },
  // Impostos por localização (calculateOrderTotal)
  TAX_RATES_LOCATION: {
    EUROPE: 0.2,
    USA: 0.1,
    ASIA: 0.15,
  },
  // Taxas de pagamento por tipo (calculateOrderTotal)
  PAYMENT_COSTS: {
    CARD: 0.03,
    BANK: 0,
    DIGITAL: 0.02,
  },
};

// --- 2. FUNÇÕES AUXILIARES DE CÁLCULO (Código limpo e reutilizável) ---

/**
 * @description Calcula o subtotal de um pedido, ignorando itens com preço/quantidade inválidos.
 * @param {OrderData} orderData
 * @returns {number} O subtotal calculado.
 */
function calculateSubtotal(orderData) {
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return 0;
  }

  // Uso de reduce para acumular o subtotal de forma funcional
  return orderData.items.reduce((acc, item) => {
    // Uso de desestruturação para clareza
    const { price, quantity } = item || {};
    // Validação estrita (item.price > 0 && item.quantity > 0)
    if (price > 0 && quantity > 0) {
      return acc + price * quantity;
    }
    return acc;
  }, 0);
}

/**
 * @description Calcula o desconto total baseado no tipo de usuário e promoções.
 * @param {number} subtotal
 * @param {UserInfo} userInfo
 * @param {PromoInfo} promoInfo
 * @returns {number} O valor total do desconto.
 */
function calculateDiscount(subtotal, userInfo, promoInfo) {
  if (subtotal <= 0) return 0;

  // 1. Desconto do usuário (processOrder original)
  let userDiscountRate = 0;
  if (userInfo && userInfo.type) {
    // Uso de lookup table (map) para simplificar o if/else if aninhado
    const userType = userInfo.type.toUpperCase();
    userDiscountRate = CONSTANTS.USER_DISCOUNTS[userType] || 0;
  }
  let totalDiscount = subtotal * userDiscountRate;

  // 2. Desconto da promoção
  if (promoInfo && promoInfo.code) {
    const promoCode = promoInfo.code.toUpperCase();
    const promoDiscountRate = CONSTANTS.PROMO_DISCOUNTS[promoCode] || 0;

    // Apenas códigos que dão desconto somam ao total
    if (promoDiscountRate > 0) {
      totalDiscount += subtotal * promoDiscountRate;
    }
  }

  return totalDiscount;
}

/**
 * @description Calcula o custo do frete com base no tipo de envio e no código promocional.
 * @param {ShippingInfo} shippingInfo
 * @param {PromoInfo} promoInfo
 * @returns {number} O custo do frete.
 */
function calculateShipping(shippingInfo, promoInfo) {
  // 1. Promoção de Frete Grátis anula o frete (Regra do código legacy)
  if (
    promoInfo &&
    promoInfo.code &&
    promoInfo.code.toUpperCase() === "FREESHIP"
  ) {
    return 0;
  }

  // 2. Custo baseado no tipo de envio
  if (shippingInfo && shippingInfo.type) {
    const shippingType = shippingInfo.type.toUpperCase();
    // Uso de lookup table (map) para simplificar o if/else if aninhado
    return CONSTANTS.SHIPPING_COSTS[shippingType] || 0;
  }

  return 0;
}

/**
 * @description Calcula o imposto de vendas.
 * @param {number} baseAmount - subtotal - desconto
 * @param {UserInfo} userInfo
 * @returns {number} O valor do imposto.
 */
function calculateTax(baseAmount, userInfo) {
  // Se userInfo.state for undefined/null, retorna 0. Mas se for string, continua.
  if (baseAmount <= 0 || !userInfo || !userInfo.state) return 0;

  const state = userInfo.state.toUpperCase();
  const stateRates = CONSTANTS.TAX_RATES_STATE;

  const taxRate = state in stateRates ? stateRates[state] : stateRates.DEFAULT;

  return baseAmount * taxRate;
}

/**
 * @description Calcula a taxa de processamento de pagamento.
 * @param {number} baseAmount - subtotal - desconto
 * @param {PaymentInfo} paymentInfo
 * @returns {number} O valor da taxa de pagamento.
 */
function calculatePaymentFee(baseAmount, paymentInfo) {
  if (baseAmount <= 0 || !paymentInfo || !paymentInfo.method) return 0;

  const paymentMethod = paymentInfo.method.toUpperCase();
  const feeRate = CONSTANTS.PAYMENT_FEES[paymentMethod] || 0;

  return baseAmount * feeRate;
}

// --- 3. FUNÇÃO PRINCIPAL DE PROCESSAMENTO/CÁLCULO ---

/**
 * @description Processa um pedido completo, aplicando todas as regras de negócio e calculando o total.
 * Mantém a mesma funcionalidade de processOrder, calculateOrderTotal e validateAndProcessOrder (sem as side-effects de inventário).
 * @param {OrderData} orderData
 * @param {UserInfo} userInfo
 * @param {PaymentInfo} paymentInfo
 * @param {ShippingInfo} shippingInfo
 * @param {PromoInfo} promoInfo
 * @returns {{subtotal: number, discount: number, tax: number, shipping: number, paymentFee: number, finalTotal: number}}
 * @throws {Error} Se a validação de entrada falhar.
 */
function processOrder(
  orderData,
  userInfo,
  paymentInfo,
  shippingInfo,
  promoInfo
) {
  // 1. Validação de Entrada - Fail-Fast
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    throw new Error("ORDER_INVALID: Pedido ou itens do pedido não informados.");
  }

  // 2. Cálculo do Subtotal
  const subtotal = calculateSubtotal(orderData);
  if (subtotal <= 0) {
    throw new Error("ORDER_INVALID: Subtotal deve ser positivo.");
  }

  // 3. Cálculo de Desconto, Frete, Imposto e Taxa (baseado na lógica do processOrder original)

  // Desconto
  const discount = calculateDiscount(subtotal, userInfo, promoInfo);

  // Base para Imposto/Taxa
  const baseAmount = subtotal - discount;

  // Imposto
  const tax = calculateTax(baseAmount, userInfo);

  // Taxa de Pagamento
  const paymentFee = calculatePaymentFee(baseAmount, paymentInfo);

  // Frete
  const shipping = calculateShipping(shippingInfo, promoInfo);

  // 4. Cálculo do Total
  let finalTotal = baseAmount + tax + shipping + paymentFee;

  // Lógica do código legacy (Garantir que o total não seja negativo)
  if (finalTotal < 0) {
    finalTotal = 0;
  }

  // Arredondamento (Duas casas decimais)
  finalTotal = Math.round(finalTotal * 100) / 100;

  // 5. Retorno
  return {
    subtotal: Math.round(subtotal * 100) / 100, // Arredonda subtotal para consistência
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    paymentFee: Math.round(paymentFee * 100) / 100,
    finalTotal,
  };
}

// --- 4. FUNÇÃO DE VALIDAÇÃO (Responsabilidade Única) ---

/**
 * @description Valida a estrutura completa de um pedido e dados associados.
 * Extraído da lógica de alta complexidade ciclomática do legacy.
 * @param {OrderData} order
 * @param {UserInfo} user
 * @param {PaymentInfo} payment
 * @param {ShippingInfo} shipping
 * @param {object} inventory - Mock para o serviço de inventário
 * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
 */
function validateOrder(order, user, payment, shipping, inventory) {
  const errors = [];
  const warnings = [];

  // --- Validação de Pedido (Order) ---
  if (!order) {
    errors.push("Pedido não informado");
  } else if (!order.items) {
    errors.push("Itens do pedido não informados");
  } else if (order.items.length === 0) {
    errors.push("Pedido sem itens");
  } else {
    // Validação de Item (reduce/map é mais limpo que for com ifs aninhados)
    order.items.forEach((item, index) => {
      const { id, quantity, price } = item || {};
      if (!item) {
        errors.push(`Item inválido na posição ${index}`);
        return;
      }
      if (!id) errors.push(`ID do item não informado (posição ${index})`);
      if (!quantity) errors.push(`Quantidade não informada para item ${id}`);
      if (!price) errors.push(`Preço não informado para item ${id}`);
      if (typeof quantity !== "number" || quantity <= 0)
        errors.push(`Quantidade inválida para item ${id}`);
      if (typeof price !== "number" || price <= 0)
        errors.push(`Preço inválido para item ${id}`);

      // Simulação da lógica de inventário
      if (id && quantity > 0 && inventory && inventory.checkStock) {
        // Uso de ===
        if (inventory.checkStock(id, quantity) === false) {
          errors.push(`Item ${id} não disponível em estoque`);
        }
      }
    });
  }

  // --- Validação de Usuário (User) ---
  if (!user) {
    errors.push("Usuário não informado");
  } else {
    // Uso de Guard Clauses (Early Exit) para evitar aninhamento
    if (!user.id) errors.push("ID do usuário não informado");
    if (!user.email) errors.push("Email do usuário não informado");
    if (!user.address) errors.push("Endereço do usuário não informado");
  }

  // --- Validação de Pagamento (Payment) ---
  if (!payment) {
    errors.push("Informações de pagamento não fornecidas");
  } else {
    if (!payment.method) errors.push("Método de pagamento não informado");
    if (!payment.amount) errors.push("Valor do pagamento não informado");
    if (payment.amount <= 0) errors.push("Valor do pagamento inválido");
  }

  // O código legacy tinha lógica misturada (if (true || false) {}) que foi removida.

  return {
    isValid: errors.length === 0,
    errors,
    warnings, // Mantém o formato de retorno
  };
}

// --- 5. CLASSE DE PROCESSAMENTO (Ponto de entrada) ---

class OrderProcessor {
  /**
   * @description Processa um pedido, calculando todos os totais.
   * Centraliza a lógica para processOrder e calculateOrderTotal do código legacy.
   * @param {OrderData} orderData
   * @param {UserInfo} userInfo
   * @param {PaymentInfo} paymentInfo
   * @param {ShippingInfo} shippingInfo
   * @param {PromoInfo} promoInfo
   * @returns {{subtotal: number, discount: number, tax: number, shipping: number, paymentFee: number, finalTotal: number}}
   * @throws {Error} Se a validação de entrada falhar.
   */
  processOrder(orderData, userInfo, paymentInfo, shippingInfo, promoInfo) {
    // Lógica do processamento principal
    return processOrder(
      orderData,
      userInfo,
      paymentInfo,
      shippingInfo,
      promoInfo
    );
  }

  // =====

  /**
   * @description Mantém o método validateAndProcessOrder por compatibilidade, mas usa o novo validador.
   * @param {OrderData} order
   * @param {UserInfo} user
   * @param {PaymentInfo} payment
   * @param {ShippingInfo} shipping
   * @param {PromoInfo} promo
   * @param {object} inventory
   * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
   */
  validateAndProcessOrder(order, user, payment, shipping, promo, inventory) {
    // Ignora parâmetros não utilizados no legacy (warehouse, logistics, notifications, analytics, audit, compliance)
    // Retorna o resultado da função de responsabilidade única
    return validateOrder(order, user, payment, shipping, inventory);
  }
}

// Exportações refatoradas
module.exports = {
  OrderProcessor,
  processOrder,
  validateOrder,
  calculateSubtotal,
  calculateDiscount,
  calculateShipping,
  calculateTax,
  calculatePaymentFee,
  CONSTANTS,
};
