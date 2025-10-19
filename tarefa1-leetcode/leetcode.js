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

  for (let i = 0; i < s.length; i++) {
    const char = s[i];

    // Se o caractere for um parêntese de fechamento
    if (map[char]) {
      const topElement = stack.pop();

      // Condição 1: A pilha está vazia (fechamento sem abertura) OU
      // Condição 2: O parêntese de abertura no topo da pilha não corresponde ao parêntese de fechamento atual
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

function findFirstError(s) {
  // Implementar aqui
  return { valid: false, error: null, position: 0, character: "" };
}

module.exports = { isValid, findFirstError };
