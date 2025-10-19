/**
 * LeetCode Problem: Valid Parentheses
 *
 * Problema: Dada uma string contendo apenas os caracteres '(', ')', '{', '}', '[' e ']',
 * determine se a string de entrada é válida.
 *
 * Uma string de entrada é válida se:
 * 1. Parênteses abertos devem ser fechados pelo mesmo tipo.
 * 2. Parênteses abertos devem ser fechados na ordem correta.
 * 3. Cada parêntese fechado tem um parêntese aberto correspondente do mesmo tipo.
 *
 * Categoria: String, Stack
 *
 * Exemplo:
 * Input: s = "()"
 * Output: true
 *
 * Input: s = "()[]{}"
 * Output: true
 *
 * Input: s = "(]"
 * Output: false
 *
 * Input: s = "([)]"
 * Output: false
 *
 * Input: s = "{[]}"
 * Output: true
 */

console.log("Início Tarefa 1 - Gemini");

/**
 * @description Determina se a string de entrada é válida (todos os parênteses são fechados corretamente e na ordem certa).
 * Usa for...of para melhor legibilidade.
 * @param {string} s A string de entrada contendo apenas '(', ')', '{', '}', '[' e ']'.
 * @returns {boolean} True se a string for válida, False caso contrário.
 */
function isValid(s) {
  /**
   * @description Mapa para checar rapidamente o par correspondente
   */
  const map = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  /**
   * @description Pilha para manter os parênteses de abertura que ainda não foram fechados
   */
  const stack = [];

  for (const char of s) {
    // Se o caractere for um parêntese de fechamento
    if (map[char]) {
      const topElement = stack.pop();

      // Verifica Mismatch ou pilha vazia
      if (!topElement || topElement !== map[char]) {
        return false;
      }
    } else {
      // Se for um parêntese de abertura, empilha
      stack.push(char);
    }
  }

  // Se a pilha estiver vazia, todos os parênteses foram fechados corretamente
  return stack.length === 0;
}

/**
 * Encontra o primeiro erro de parênteses na string.
 * @param {string} s A string de entrada.
 * @returns {{ valid: boolean, error: string|null, position: number, character: string }} Objeto com detalhes do erro ou sucesso.
 */
function findFirstError(s) {
  const map = {
    ")": "(",
    "]": "[",
    "}": "{",
  };

  // Pilha armazena { char, position }
  const stack = []; // [abertura, indice]
  const openingChars = Object.values(map);

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    // Se for um parêntese de abertura, empilha o caractere e a sua posição
    if (openingChars.includes(char)) {
      stack.push({ char, position: i });
    }
    // Se for um parêntese de fechamento
    else if (map[char]) {
      const topElement = stack.pop();

      // Caso de erro 1: Fechamento sem abertura (pilha vazia) OU Mismatch
      if (!topElement) {
        // Parêntese fechado sem par de abertura
        return {
          valid: false,
          error: "Parêntese fechado sem par de abertura",
          position: i,
          character: char,
        };
      } else if (topElement.char !== map[char]) {
        // Mismatch: Abertura e fechamento incompatíveis
        return {
          valid: false,
          error: `Parêntese de fechamento '${char}' não corresponde ao de abertura esperado '${map[char]}'`,
          position: i,
          character: char,
        };
      }
    }
  }

  // Caso de erro 2: Unclosed opening bracket (pilha não vazia no final)
  if (stack.length > 0) {
    const unclosed = stack.at(-1);

    return {
      valid: false,
      error: `Parêntese de abertura '${unclosed.char}' não foi fechado`,
      position: unclosed.position,
      character: unclosed.char,
    };
  }

  // Se a pilha estiver vazia, a string é válida
  return { valid: true, error: null, position: s.length, character: "" };
}

module.exports = { isValid, findFirstError };
