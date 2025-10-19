console.log("Início Tarefa 3 - Gemini");

// --- CONSTANTES ---
/** @enum {string} */
const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

/** @enum {string} */
const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// --- CLASSES DE ESTRUTURA E AUXILIARES ---

/**
 * @description Gerencia a geração de códigos únicos estilo Jira (ex: PROJ-1, FEAT-2).
 */
class CodeGenerator {
  /** @type {Object.<string, number>} */
  static counters = {
    PROJ: 0,
    TASK: 0,
    FEAT: 0,
    BUG: 0,
  };

  /**
   * @description Gera um novo código único para um prefixo dado.
   * @param {string} prefix - O prefixo do código (ex: 'PROJ', 'TASK').
   * @returns {string} O código único gerado (ex: 'PROJ-1').
   */
  static generate(prefix = "TASK") {
    const upperPrefix = prefix.toUpperCase();
    if (!CodeGenerator.counters.hasOwnProperty(upperPrefix)) {
      CodeGenerator.counters[upperPrefix] = 0;
    }
    CodeGenerator.counters[upperPrefix]++;
    return `${upperPrefix}-${CodeGenerator.counters[upperPrefix]}`;
  }

  /**
   * @description Reseta todos os contadores. Útil para testes.
   */
  static resetCounters() {
    CodeGenerator.counters = {
      PROJ: 0,
      TASK: 0,
      FEAT: 0,
      BUG: 0,
    };
  }
}

/**
 * @description Classe que representa uma única tarefa.
 */
class Task {
  /**
   * @param {string} title
   * @param {string} description
   * @param {string} priority
   * @param {string} [codePrefix='TASK']
   */
  constructor(title, description, priority, codePrefix = "TASK") {
    // Validação inicial
    if (!title || title.length < 3) {
      throw new Error("O título da tarefa deve ter pelo menos 3 caracteres.");
    }
    if (!Object.values(TASK_PRIORITY).includes(priority)) {
      throw new Error(
        `Prioridade inválida: ${priority}. Deve ser ${Object.values(
          TASK_PRIORITY
        ).join(", ")}.`
      );
    }

    this.id = Date.now() + Math.random(); // ID simples baseado em tempo
    this.code = CodeGenerator.generate(codePrefix); // Código único estilo Jira
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.status = TASK_STATUS.TODO;
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
    this.completedAt = null;
  }

  /**
   * @description Atualiza os campos editáveis da tarefa e o timestamp.
   * @param {string} [title]
   * @param {string} [description]
   * @param {string} [priority]
   */
  update({ title, description, priority }) {
    let updated = false;

    if (title !== undefined && title !== this.title) {
      if (title.length < 3) {
        throw new Error("O título da tarefa deve ter pelo menos 3 caracteres.");
      }
      this.title = title;
      updated = true;
    }

    if (description !== undefined && description !== this.description) {
      this.description = description;
      updated = true;
    }

    if (priority !== undefined && priority !== this.priority) {
      if (!Object.values(TASK_PRIORITY).includes(priority)) {
        throw new Error(
          `Prioridade inválida: ${priority}. Deve ser ${Object.values(
            TASK_PRIORITY
          ).join(", ")}.`
        );
      }
      this.priority = priority;
      updated = true;
    }

    if (updated) {
      this.updatedAt = new Date();
    }
  }

  /**
   * @description Altera o status da tarefa, registrando a data de conclusão se for 'done'.
   * @param {string} newStatus - O novo status.
   */
  changeStatus(newStatus) {
    if (this.status === newStatus) return; // Nenhuma mudança

    if (!Object.values(TASK_STATUS).includes(newStatus)) {
      throw new Error(
        `Status inválido: ${newStatus}. Deve ser ${Object.values(
          TASK_STATUS
        ).join(", ")}.`
      );
    }

    this.status = newStatus;
    this.updatedAt = new Date();

    if (newStatus === TASK_STATUS.DONE) {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }
}

// --- CLASSE PRINCIPAL DE GERENCIAMENTO ---

/**
 * @description Gerenciador central de tarefas (TodoManager).
 */
class TodoManager {
  constructor() {
    /** @type {Task[]} */
    this.tasks = [];
  }

  // --- MÉTODOS CRUD ---

  /**
   * @description Cria e adiciona uma nova tarefa ao gerenciador.
   * @param {string} title
   * @param {string} description
   * @param {string} priority
   * @param {string} [codePrefix='TASK']
   * @returns {Task} A tarefa recém-criada.
   */
  createTask(title, description, priority, codePrefix = "TASK") {
    // A validação é feita no construtor da classe Task
    const newTask = new Task(title, description, priority, codePrefix);
    this.tasks.push(newTask);
    return newTask;
  }

  /**
   * @description Encontra uma tarefa por ID ou Código.
   * @param {number|string} identifier - O ID ou o Código da tarefa.
   * @returns {Task|null} A tarefa encontrada ou null.
   */
  getTask(identifier) {
    // Converte identificador para string para busca uniforme
    const idStr = String(identifier).toUpperCase();

    return (
      this.tasks.find(
        (task) => task.id === identifier || task.code.toUpperCase() === idStr
      ) || null
    );
  }

  /**
   * @description Retorna uma cópia da lista de todas as tarefas.
   * @returns {Task[]}
   */
  listAllTasks() {
    return [...this.tasks];
  }

  /**
   * @description Atualiza os detalhes de uma tarefa (título, descrição, prioridade).
   * @param {number|string} identifier - ID ou Código da tarefa.
   * @param {object} updates - Objeto com campos a serem atualizados.
   * @returns {Task} A tarefa atualizada.
   * @throws {Error} Se a tarefa não for encontrada ou a atualização for inválida.
   */
  updateTask(identifier, updates) {
    const task = this.getTask(identifier);
    if (!task) {
      throw new Error(
        `Tarefa não encontrada com o identificador: ${identifier}`
      );
    }
    task.update(updates);
    return task;
  }

  /**
   * @description Altera o status de uma tarefa.
   * @param {number|string} identifier - ID ou Código da tarefa.
   * @param {string} newStatus - O novo status.
   * @returns {Task} A tarefa modificada.
   * @throws {Error} Se a tarefa não for encontrada ou o status for inválido.
   */
  changeTaskStatus(identifier, newStatus) {
    const task = this.getTask(identifier);
    if (!task) {
      throw new Error(
        `Tarefa não encontrada com o identificador: ${identifier}`
      );
    }
    task.changeStatus(newStatus);
    return task;
  }

  /**
   * @description Remove uma tarefa por ID ou Código.
   * @param {number|string} identifier - ID ou Código da tarefa.
   * @returns {boolean} True se a tarefa foi removida, False se não foi encontrada.
   */
  removeTask(identifier) {
    const initialLength = this.tasks.length;
    // Filtra, mantendo apenas as tarefas que NÃO correspondem ao ID/Código
    this.tasks = this.tasks.filter(
      (task) =>
        task.id !== identifier &&
        task.code.toUpperCase() !== String(identifier).toUpperCase()
    );
    return this.tasks.length < initialLength;
  }

  // --- MÉTODOS DE FILTRAGEM, BUSCA E CONTAGEM ---

  /**
   * @description Filtra tarefas por status e/ou prioridade.
   * @param {string} [status] - Status para filtrar.
   * @param {string} [priority] - Prioridade para filtrar.
   * @returns {Task[]} Lista de tarefas filtradas.
   */
  filterTasks({ status, priority }) {
    let filteredTasks = this.tasks;

    if (status) {
      const lowerStatus = status.toLowerCase();
      if (!Object.values(TASK_STATUS).includes(lowerStatus)) {
        throw new Error(`Status de filtro inválido: ${status}.`);
      }
      filteredTasks = filteredTasks.filter(
        (task) => task.status === lowerStatus
      );
    }

    if (priority) {
      const lowerPriority = priority.toLowerCase();
      if (!Object.values(TASK_PRIORITY).includes(lowerPriority)) {
        throw new Error(`Prioridade de filtro inválida: ${priority}.`);
      }
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === lowerPriority
      );
    }

    return filteredTasks;
  }

  /**
   * @description Busca tarefas por uma substring no título (case-insensitive).
   * @param {string} query - Substring a ser buscada no título.
   * @returns {Task[]} Lista de tarefas que correspondem à busca.
   */
  searchTasksByTitle(query) {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    return this.tasks.filter((task) =>
      task.title.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * @description Conta o número de tarefas para cada status.
   * @returns {Object.<string, number>} Objeto com a contagem por status.
   */
  countTasksByStatus() {
    const counts = {
      [TASK_STATUS.TODO]: 0,
      [TASK_STATUS.IN_PROGRESS]: 0,
      [TASK_STATUS.DONE]: 0,
    };

    this.tasks.forEach((task) => {
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status]++;
      }
    });

    return counts;
  }
}

module.exports = {
  TodoManager,
  Task,
  CodeGenerator,
  TASK_STATUS,
  TASK_PRIORITY,
};
