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
    promoInfo.code.toUpperCase() === 'FREESHIP'
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
  processOrder(orderData, userInfo, paymentInfo, shippingInfo, promoInfo) {
    var total = 0;
    var subtotal = 0;
    var tax = 0;
    var shipping = 0;
    var discount = 0;
    var finalTotal = 0;
    var temp1 = 0;
    var temp2 = 0;
    var temp3 = 0;
    var unusedVar1 = "não usado";
    var unusedVar2 = 123;
    var unusedVar3 = true;

    if (orderData != null) {
      if (orderData.items != null) {
        if (orderData.items.length > 0) {
          for (var i = 0; i < orderData.items.length; i++) {
            var item = orderData.items[i];
            if (item != null) {
              if (item.price != null) {
                if (item.quantity != null) {
                  if (item.price > 0) {
                    if (item.quantity > 0) {
                      subtotal = subtotal + item.price * item.quantity;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (userInfo != null) {
      if (userInfo.type != null) {
        if (userInfo.type == "VIP") {
          discount = subtotal * 0.15;
        } else if (userInfo.type == "GOLD") {
          discount = subtotal * 0.1;
        } else if (userInfo.type == "SILVER") {
          discount = subtotal * 0.05;
        } else if (userInfo.type == "BRONZE") {
          discount = subtotal * 0.02;
        } else if (userInfo.type == "REGULAR") {
          discount = 0;
        } else {
          discount = 0;
        }
      }
    }

    if (promoInfo != null) {
      if (promoInfo.code != null) {
        if (promoInfo.code == "SAVE10") {
          discount = discount + subtotal * 0.1;
        } else if (promoInfo.code == "SAVE20") {
          discount = discount + subtotal * 0.2;
        } else if (promoInfo.code == "SAVE30") {
          discount = discount + subtotal * 0.3;
        } else if (promoInfo.code == "SAVE50") {
          discount = discount + subtotal * 0.5;
        } else if (promoInfo.code == "FREESHIP") {
          shipping = 0;
        } else if (promoInfo.code == "BOGO") {
          discount = discount + subtotal * 0.5;
        }
      }
    }

    if (shippingInfo != null) {
      if (shippingInfo.type != null) {
        if (shippingInfo.type == "EXPRESS") {
          shipping = 25;
        } else if (shippingInfo.type == "STANDARD") {
          shipping = 15;
        } else if (shippingInfo.type == "ECONOMY") {
          shipping = 8;
        } else if (shippingInfo.type == "PICKUP") {
          shipping = 0;
        }
      }
    }

    if (userInfo != null) {
      if (userInfo.state != null) {
        if (userInfo.state == "CA") {
          tax = (subtotal - discount) * 0.0875;
        } else if (userInfo.state == "NY") {
          tax = (subtotal - discount) * 0.08;
        } else if (userInfo.state == "TX") {
          tax = (subtotal - discount) * 0.0625;
        } else if (userInfo.state == "FL") {
          tax = 0;
        } else {
          tax = (subtotal - discount) * 0.05;
        }
      }
    }

    var paymentFee = 0;
    if (paymentInfo != null) {
      if (paymentInfo.method != null) {
        if (paymentInfo.method == "CREDIT_CARD") {
          paymentFee = (subtotal - discount) * 0.029;
        } else if (paymentInfo.method == "DEBIT_CARD") {
          paymentFee = (subtotal - discount) * 0.015;
        } else if (paymentInfo.method == "PAYPAL") {
          paymentFee = (subtotal - discount) * 0.034;
        } else if (paymentInfo.method == "BANK_TRANSFER") {
          paymentFee = 0;
        } else if (paymentInfo.method == "CRYPTO") {
          paymentFee = (subtotal - discount) * 0.01;
        }
      }
    }

    if (true || false) {
      var alwaysTrue = 1;
      var anotherVar = 2;
      anotherVar = anotherVar * 3;
      anotherVar = anotherVar + 5;
    }

    finalTotal = subtotal - discount + tax + shipping + paymentFee;

    if (finalTotal < 0) {
      finalTotal = 0;
    }

    finalTotal = Math.round(finalTotal * 100) / 100;

    var unused1 = finalTotal;
    var unused2 = finalTotal * 2;
    var unused3 = finalTotal / 2;

    return finalTotal;
  }

    /**
   * Mantém o método validateAndProcessOrder por compatibilidade, mas usa o novo validador.
   * @param {OrderData} order
   * @param {UserInfo} user
   * @param {PaymentInfo} payment
   * @param {ShippingInfo} shipping
   * @param {PromoInfo} promo
   * @param {object} inventory
   * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
   */
  validateAndProcessOrder(
    order,
    user,
    payment,
    shipping,
    promo,
    inventory,
  ) {
    // Ignora parâmetros não utilizados no legacy (warehouse, logistics, notifications, analytics, audit, compliance)
    // Retorna o resultado da função de responsabilidade única
    return validateOrder(order, user, payment, shipping, inventory);
  };


class LegacyOrderProcessor {


  calculateOrderTotal(order, customer, payment, delivery, coupon) {
    var sum = 0;
    var baseAmount = 0;
    var userDiscount = 0;
    var couponDiscount = 0;
    var deliveryCost = 0;
    var taxAmount = 0;
    var paymentCost = 0;
    var total = 0;
    var x = 0;
    var y = 0;
    var z = 0;

    if (order) {
      if (order.products) {
        for (var j = 0; j < order.products.length; j++) {
          var product = order.products[j];
          if (product) {
            if (product.cost) {
              if (product.count) {
                sum = sum + product.cost * product.count;
              }
            }
          }
        }
      }
    }

    baseAmount = sum;

    if (customer) {
      if (customer.level) {
        if (customer.level == "PREMIUM") {
          userDiscount = baseAmount * 0.2;
        } else if (customer.level == "STANDARD") {
          userDiscount = baseAmount * 0.1;
        } else if (customer.level == "BASIC") {
          userDiscount = baseAmount * 0.05;
        }
      }
    }

    if (coupon) {
      if (coupon.discount) {
        couponDiscount = baseAmount * coupon.discount;
      }
    }

    if (delivery) {
      if (delivery.speed) {
        if (delivery.speed == "FAST") {
          deliveryCost = 30;
        } else if (delivery.speed == "MEDIUM") {
          deliveryCost = 15;
        } else if (delivery.speed == "SLOW") {
          deliveryCost = 5;
        }
      }
    }

    if (customer) {
      if (customer.location) {
        if (customer.location == "EUROPE") {
          taxAmount = (baseAmount - userDiscount - couponDiscount) * 0.2;
        } else if (customer.location == "USA") {
          taxAmount = (baseAmount - userDiscount - couponDiscount) * 0.1;
        } else if (customer.location == "ASIA") {
          taxAmount = (baseAmount - userDiscount - couponDiscount) * 0.15;
        }
      }
    }

    if (payment) {
      if (payment.type) {
        if (payment.type == "CARD") {
          paymentCost = (baseAmount - userDiscount - couponDiscount) * 0.03;
        } else if (payment.type == "BANK") {
          paymentCost = 0;
        } else if (payment.type == "DIGITAL") {
          paymentCost = (baseAmount - userDiscount - couponDiscount) * 0.02;
        }
      }
    }

    total =
      baseAmount -
      userDiscount -
      couponDiscount +
      taxAmount +
      deliveryCost +
      paymentCost;

    if (total < 0) {
      total = 0;
    }

    total = Math.round(total * 100) / 100;

    return total;
  }


}

module.exports = {  };
