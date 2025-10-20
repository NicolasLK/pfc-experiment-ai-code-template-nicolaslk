const {
  TodoManager,
  CodeGenerator,
  TASK_STATUS,
  TASK_PRIORITY,
} = require("./todoManager");

describe("Sistema de Gerenciamento de Tarefas", () => {
  let manager;

  // Setup: Garante que cada teste use uma instância nova do manager
  // e que os contadores de código sejam zerados.
  beforeEach(() => {
    manager = new TodoManager();
    CodeGenerator.resetCounters();
  });

  // --- Implementar testes para createTask ---
  test("deve criar uma tarefa com dados básicos e código Jira", () => {
    const title = "Implementar login";
    const description = "Criar sistema de autenticação";
    const priority = TASK_PRIORITY.HIGH;
    const codePrefix = "PROJ";

    const task = manager.createTask(title, description, priority, codePrefix);

    // Verificar: ID único, código PROJ-1, status TODO, datas criadas
    expect(typeof task.id).toBe("number");
    expect(task.code).toBe("PROJ-1");
    expect(task.title).toBe(title);
    expect(task.status).toBe(TASK_STATUS.TODO);
    expect(task.priority).toBe(priority);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.completedAt).toBeNull();
  });

  // --- Implementar testes para listTasks ---
  test("deve listar todas as tarefas criadas", () => {
    // Testar: criar 2 tarefas e listar
    manager.createTask("Tarefa 1", "d", TASK_PRIORITY.LOW);
    manager.createTask("Tarefa 2", "d", TASK_PRIORITY.MEDIUM);

    // Verificar: array com 2 tarefas, dados corretos
    const tasks = manager.listAllTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].title).toBe("Tarefa 1");
    expect(tasks[1].code).toBe("TASK-2");
  });

  // --- Implementar testes para updateTask ---
  test("deve atualizar dados de uma tarefa existente", () => {
    const task = manager.createTask(
      "Título Antigo",
      "Desc Antiga",
      TASK_PRIORITY.LOW
    );
    const originalUpdatedAt = task.updatedAt;

    // Pausa para garantir que o timestamp seja diferente
    return new Promise((resolve) => {
      setTimeout(() => {
        manager.updateTask(task.id, {
          title: "Título Novo",
          priority: TASK_PRIORITY.HIGH,
          description: "Nova descrição",
        });

        const updatedTask = manager.getTask(task.id);

        // Verificar: dados atualizados, updatedAt modificado
        expect(updatedTask.title).toBe("Título Novo");
        expect(updatedTask.description).toBe("Nova descrição");
        expect(updatedTask.priority).toBe(TASK_PRIORITY.HIGH);
        expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime()
        );

        resolve();
      }, 10);
    });
  });

  // --- Implementar testes para deleteTask ---
  test("deve remover uma tarefa por ID", () => {
    const task1 = manager.createTask("Remover esta", "d", TASK_PRIORITY.LOW);
    manager.createTask("Manter esta", "d", TASK_PRIORITY.LOW);

    // Testar: criar tarefa, remover por ID
    const removed = manager.removeTask(task1.id);

    // Verificar: tarefa removida, array vazio
    expect(removed).toBe(true);
    expect(manager.listAllTasks().length).toBe(1);
    expect(manager.listAllTasks()[0].title).toBe("Manter esta");

    // Tentar remover a mesma tarefa
    expect(manager.removeTask(task1.id)).toBe(false);
  });

  // --- Implementar testes para changeTaskStatus ---
  test("deve alterar status da tarefa e definir completedAt", () => {
    const task = manager.createTask("Mudar status", "d", TASK_PRIORITY.LOW);

    // Mudar para IN_PROGRESS
    manager.changeTaskStatus(task.id, TASK_STATUS.IN_PROGRESS);
    expect(task.status).toBe(TASK_STATUS.IN_PROGRESS);
    expect(task.completedAt).toBeNull();

    // Mudar para DONE
    manager.changeTaskStatus(task.id, TASK_STATUS.DONE);

    // Verificar: status DONE, completedAt definido
    expect(task.status).toBe(TASK_STATUS.DONE);
    expect(task.completedAt).toBeInstanceOf(Date);

    // Mudar de volta para TODO deve resetar completedAt
    manager.changeTaskStatus(task.id, TASK_STATUS.TODO);
    expect(task.status).toBe(TASK_STATUS.TODO);
    expect(task.completedAt).toBeNull();
  });

  // --- Implementar testes para filterTasksByStatus ---
  test("deve filtrar tarefas por status TODO", () => {
    const t1 = manager.createTask("Task 1", "d", TASK_PRIORITY.LOW);
    const t2 = manager.createTask("Task 2", "d", TASK_PRIORITY.MEDIUM);
    const t3 = manager.createTask("Task 3", "d", TASK_PRIORITY.HIGH);

    manager.changeTaskStatus(t1.id, TASK_STATUS.DONE);
    manager.changeTaskStatus(t3.id, TASK_STATUS.IN_PROGRESS);

    // Filtrar por TODO
    const todoTasks = manager.filterTasks({ status: TASK_STATUS.TODO });

    // Verificar: apenas tarefas TODO retornadas
    expect(todoTasks.length).toBe(1);
    expect(todoTasks[0].title).toBe("Task 2");

    // Filtrar por DONE
    const doneTasks = manager.filterTasks({ status: TASK_STATUS.DONE });
    expect(doneTasks.length).toBe(1);
    expect(doneTasks[0].title).toBe("Task 1");
  });

  // --- Implementar testes para filterTasksByPriority ---
  test("deve filtrar tarefas por prioridade HIGH", () => {
    manager.createTask("low", "d", TASK_PRIORITY.LOW);
    manager.createTask("medium", "d", TASK_PRIORITY.MEDIUM);
    const high1 = manager.createTask("high 1", "d", TASK_PRIORITY.HIGH);
    const high2 = manager.createTask("high 2", "d", TASK_PRIORITY.HIGH);

    // Filtrar por HIGH
    const highPriorityTasks = manager.filterTasks({
      priority: TASK_PRIORITY.HIGH,
    });

    // Verificar: apenas tarefas HIGH retornadas
    expect(highPriorityTasks.length).toBe(2);
    expect(highPriorityTasks.map((t) => t.title)).toEqual(["high 1", "high 2"]);
  });

  // --- Implementar testes para searchTasks ---
  test("deve buscar tarefas por título", () => {
    manager.createTask(
      "Implementar feature de login",
      "d",
      TASK_PRIORITY.MEDIUM
    );
    manager.createTask("Criar testes para busca", "d", TASK_PRIORITY.MEDIUM);
    manager.createTask(
      "Corrigir bug no módulo de login",
      "d",
      TASK_PRIORITY.MEDIUM
    );

    // Buscar por palavra-chave (case-insensitive)
    const results = manager.searchTasksByTitle("Login");

    // Verificar: apenas tarefas com título correspondente
    expect(results.length).toBe(2);
    expect(results.map((t) => t.title)).toEqual([
      "Implementar feature de login",
      "Corrigir bug no módulo de login",
    ]);
  });

  // --- Implementar testes para getTaskCounts ---
  test("deve contar tarefas por status", () => {
    manager.createTask("Task A", "d", TASK_PRIORITY.LOW); // todo
    manager.createTask("Task B", "d", TASK_PRIORITY.MEDIUM); // todo
    const t3 = manager.createTask("Task C", "d", TASK_PRIORITY.HIGH);

    manager.changeTaskStatus(t3.id, TASK_STATUS.IN_PROGRESS);
    manager.createTask("Task D", "d", TASK_PRIORITY.LOW);
    manager.changeTaskStatus(
      manager.tasks.find((t) => t.title === "Task D").id,
      TASK_STATUS.DONE
    );

    // Contar
    const counts = manager.countTasksByStatus();

    // Verificar: contadores corretos para cada status
    expect(counts[TASK_STATUS.TODO]).toBe(2);
    expect(counts[TASK_STATUS.IN_PROGRESS]).toBe(1);
    expect(counts[TASK_STATUS.DONE]).toBe(1);
  });

  // --- Implementar testes para generateTaskCode ---
  test("deve gerar códigos únicos sequenciais", () => {
    const t1 = manager.createTask("Task A", "d", TASK_PRIORITY.LOW, "PROJ");
    const t2 = manager.createTask("Task B", "d", TASK_PRIORITY.LOW, "FEAT");
    const t3 = manager.createTask("Task C", "d", TASK_PRIORITY.LOW, "PROJ");

    // Verificar: PROJ-1, FEAT-1, PROJ-2
    expect(t1.code).toBe("PROJ-1");
    expect(t2.code).toBe("FEAT-1");
    expect(t3.code).toBe("PROJ-2");
  });

  // --- Implementar testes para findTaskByCode ---
  test("deve encontrar tarefa por código Jira", () => {
    const task = manager.createTask(
      "Buscar por código",
      "d",
      TASK_PRIORITY.MEDIUM,
      "BUG"
    );
    const taskId = task.id;
    const taskCode = task.code;

    // Buscar por código
    const foundByCode = manager.getTask(taskCode);
    expect(foundByCode.title).toBe("Buscar por código");

    // Buscar por ID
    const foundById = manager.getTask(taskId);
    expect(foundById.code).toBe("BUG-1");

    // Buscar por código minúsculo (case-insensitive)
    const foundByLowercase = manager.getTask("bug-1");
    expect(foundByLowercase.title).toBe("Buscar por código");
  });

  // --- Teste de integração ---
  test("deve gerenciar ciclo completo de uma tarefa", () => {
    // Cenário: criar tarefa → atualizar → mudar status → filtrar → buscar

    // 1. Criar tarefa
    let task = manager.createTask(
      "Task to Track",
      "Initial desc",
      TASK_PRIORITY.LOW,
      "PROJ"
    );
    const originalCode = task.code;
    expect(task.status).toBe(TASK_STATUS.TODO);

    // 2. Atualizar
    manager.updateTask(task.id, {
      title: "Task Tracked (Updated)",
      priority: TASK_PRIORITY.HIGH,
    });
    expect(task.title).toContain("Updated");
    expect(task.priority).toBe(TASK_PRIORITY.HIGH);

    // 3. Mudar status
    manager.changeTaskStatus(originalCode, TASK_STATUS.DONE);
    expect(task.status).toBe(TASK_STATUS.DONE);
    expect(task.completedAt).toBeInstanceOf(Date);

    // 4. Filtrar (deve retornar 1)
    const doneTasks = manager.filterTasks({ status: TASK_STATUS.DONE });
    expect(doneTasks.length).toBe(1);
    expect(doneTasks[0].code).toBe(originalCode);

    // 5. Buscar (deve ser encontrado)
    const searchResult = manager.searchTasksByTitle("Tracked");
    expect(searchResult.length).toBe(1);
  });

  // --- Teste de edge case ---
  test("deve lidar com operações em tarefas inexistentes", () => {
    // 1. Tentar atualizar ID inexistente
    expect(() => manager.updateTask(9999, { title: "fail" })).toThrow(
      /Tarefa não encontrada/
    );

    // 2. Tentar remover código inexistente
    expect(manager.removeTask("FAIL-1")).toBe(false);

    // 3. Tentar mudar status de ID inexistente
    expect(() => manager.changeTaskStatus(0, TASK_STATUS.DONE)).toThrow(
      /Tarefa não encontrada/
    );

    // 4. Tentar mudar status para valor inválido
    const task = manager.createTask("Valid", "d", TASK_PRIORITY.LOW);
    expect(() => manager.changeTaskStatus(task.id, "INVALID_STATUS")).toThrow(
      /Status inválido/
    );

    // 5. Tentar filtrar por valor inválido
    expect(() => manager.filterTasks({ priority: "CRITICAL" })).toThrow(
      /Prioridade de filtro inválida/
    );
  });
});
