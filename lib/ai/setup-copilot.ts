export type SetupCopilotActionType =
  | "draft_form_schema"
  | "draft_table_schema"
  | "configure_airtable"
  | "adjust_field"
  | "create_workflow"
  | "review_sync"
  | "clarify";

export type SetupCopilotActionRisk = "low" | "medium" | "high";

export type SetupCopilotProposalAction = {
  id: string;
  type: SetupCopilotActionType;
  title: string;
  description: string;
  target: {
    workspaceSlug: string;
    workflowType?: string | null;
    formSlug?: string | null;
    tableName?: string | null;
  };
  status: "suggested" | "needs_input" | "blocked";
  risk: SetupCopilotActionRisk;
  requiresConfirmation: boolean;
  patch: Record<string, unknown> | null;
  warnings: string[];
};

export type SetupCopilotProposal = {
  id: string;
  title: string;
  summary: string;
  mode: "review_only";
  confidence: "low" | "medium" | "high";
  actions: SetupCopilotProposalAction[];
  nextQuestions: string[];
  governance: {
    requiresHumanApproval: true;
    canApplyAutomatically: false;
    reason: string;
  };
};

const PROPOSAL_BLOCK_PATTERN =
  /```sunbeat-proposal\s*([\s\S]*?)```|<sunbeat_proposal>([\s\S]*?)<\/sunbeat_proposal>/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stableId(prefix: string, seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `${prefix}-${hash.toString(36)}`;
}

function normalizeActionType(value: unknown): SetupCopilotActionType {
  const normalized = text(value);
  const allowed = new Set<SetupCopilotActionType>([
    "draft_form_schema",
    "draft_table_schema",
    "configure_airtable",
    "adjust_field",
    "create_workflow",
    "review_sync",
    "clarify",
  ]);

  return allowed.has(normalized as SetupCopilotActionType)
    ? (normalized as SetupCopilotActionType)
    : "clarify";
}

function normalizeRisk(value: unknown): SetupCopilotActionRisk {
  const normalized = text(value);
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return "medium";
}

function normalizeConfidence(value: unknown): SetupCopilotProposal["confidence"] {
  const normalized = text(value);
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return "medium";
}

function normalizeAction(args: {
  value: unknown;
  workspaceSlug: string;
  index: number;
  seed: string;
}): SetupCopilotProposalAction | null {
  const action = asRecord(args.value);
  if (!action) {
    return null;
  }

  const target = asRecord(action.target) ?? {};
  const title = text(action.title) || "Revisar proposta";
  const status = text(action.status);

  return {
    id:
      text(action.id) ||
      stableId("action", `${args.seed}:${args.index}:${title}`),
    type: normalizeActionType(action.type),
    title,
    description: text(action.description) || "Acao sugerida pelo Setup Copilot.",
    target: {
      workspaceSlug: text(target.workspaceSlug) || args.workspaceSlug,
      workflowType: text(target.workflowType) || null,
      formSlug: text(target.formSlug) || null,
      tableName: text(target.tableName) || null,
    },
    status:
      status === "blocked" || status === "needs_input" || status === "suggested"
        ? status
        : "suggested",
    risk: normalizeRisk(action.risk),
    requiresConfirmation: action.requiresConfirmation !== false,
    patch: asRecord(action.patch),
    warnings: safeArray(action.warnings)
      .map((item) => text(item))
      .filter(Boolean),
  };
}

function normalizeProposal(args: {
  value: unknown;
  workspaceSlug: string;
  userMessage: string;
}): SetupCopilotProposal | null {
  const proposal = asRecord(args.value);
  if (!proposal) {
    return null;
  }

  const actions = safeArray(proposal.actions)
    .map((action, index) =>
      normalizeAction({
        value: action,
        workspaceSlug: args.workspaceSlug,
        index,
        seed: args.userMessage,
      })
    )
    .filter((action): action is SetupCopilotProposalAction => Boolean(action));

  if (actions.length === 0) {
    return null;
  }

  return {
    id:
      text(proposal.id) ||
      stableId("proposal", `${args.workspaceSlug}:${args.userMessage}`),
    title: text(proposal.title) || "Proposta de configuracao",
    summary:
      text(proposal.summary) ||
      "O Setup Copilot preparou uma proposta para revisao humana.",
    mode: "review_only",
    confidence: normalizeConfidence(proposal.confidence),
    actions,
    nextQuestions: safeArray(proposal.nextQuestions)
      .map((item) => text(item))
      .filter(Boolean)
      .slice(0, 4),
    governance: {
      requiresHumanApproval: true,
      canApplyAutomatically: false,
      reason:
        text(asRecord(proposal.governance)?.reason) ||
        "A IA pode sugerir configuracoes, mas a aplicacao exige confirmacao humana.",
    },
  };
}

export function stripSetupCopilotProposalBlock(value: string) {
  return value.replace(PROPOSAL_BLOCK_PATTERN, "").trim();
}

export function parseSetupCopilotProposal(args: {
  text: string;
  workspaceSlug: string;
  userMessage: string;
}) {
  const match = args.text.match(PROPOSAL_BLOCK_PATTERN);
  const rawJson = match?.[1] ?? match?.[2];

  if (!rawJson) {
    return null;
  }

  try {
    return normalizeProposal({
      value: JSON.parse(rawJson),
      workspaceSlug: args.workspaceSlug,
      userMessage: args.userMessage,
    });
  } catch {
    return null;
  }
}

function includesAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

function inferActionsFromMessage(args: {
  userMessage: string;
  workspaceSlug: string;
}) {
  const normalized = args.userMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const actions: SetupCopilotProposalAction[] = [];

  if (includesAny(normalized, ["formulario", "form ", "intake", "cadastro"])) {
    actions.push({
      id: stableId("action", `${args.userMessage}:form`),
      type: "draft_form_schema",
      title: "Rascunhar formulario",
      description:
        "Criar um schema de formulario revisavel antes de ativar qualquer rota publica.",
      target: { workspaceSlug: args.workspaceSlug },
      status: "needs_input",
      risk: "medium",
      requiresConfirmation: true,
      patch: null,
      warnings: ["Nao publica formulario nem altera o renderer ativo."],
    });
  }

  if (includesAny(normalized, ["tabela", "table", "view", "coluna"])) {
    actions.push({
      id: stableId("action", `${args.userMessage}:table`),
      type: "draft_table_schema",
      title: "Rascunhar tabela operacional",
      description:
        "Desenhar colunas, views e status para uma nova leitura operacional no Sunbeat Tables.",
      target: { workspaceSlug: args.workspaceSlug },
      status: "needs_input",
      risk: "medium",
      requiresConfirmation: true,
      patch: null,
      warnings: ["Nao cria tabela no Airtable sem preview e confirmacao."],
    });
  }

  if (includesAny(normalized, ["airtable", "sync", "sincron", "base"])) {
    actions.push({
      id: stableId("action", `${args.userMessage}:airtable`),
      type: "configure_airtable",
      title: "Preparar configuracao Airtable",
      description:
        "Sugerir um patch para `workspace_workflow_settings.extra_settings.airtable` usando preview antes de aplicar.",
      target: { workspaceSlug: args.workspaceSlug },
      status: "suggested",
      risk: "high",
      requiresConfirmation: true,
      patch: null,
      warnings: [
        "Airtable afeta operacao real; aplicar apenas com confirm_apply explicito.",
      ],
    });
  }

  if (includesAny(normalized, ["campo", "field", "obrigatorio", "helper"])) {
    actions.push({
      id: stableId("action", `${args.userMessage}:field`),
      type: "adjust_field",
      title: "Preparar ajuste de campo",
      description:
        "Sugerir override de label, helper, obrigatoriedade ou visibilidade para revisao.",
      target: { workspaceSlug: args.workspaceSlug },
      status: "needs_input",
      risk: "medium",
      requiresConfirmation: true,
      patch: null,
      warnings: ["Depende do workflow, step e field_key corretos."],
    });
  }

  if (includesAny(normalized, ["workflow", "fluxo", "automacao"])) {
    actions.push({
      id: stableId("action", `${args.userMessage}:workflow`),
      type: "create_workflow",
      title: "Modelar workflow",
      description:
        "Propor escopo, formulario, tabela operacional e integracoes de um novo fluxo.",
      target: { workspaceSlug: args.workspaceSlug },
      status: "needs_input",
      risk: "high",
      requiresConfirmation: true,
      patch: null,
      warnings: ["Novo workflow exige revisao de renderer, schema e integracoes."],
    });
  }

  return actions;
}

export function inferSetupCopilotProposal(args: {
  userMessage: string;
  workspaceSlug: string;
}) {
  const actions = inferActionsFromMessage(args);
  if (actions.length === 0) {
    return null;
  }

  return {
    id: stableId("proposal", `${args.workspaceSlug}:${args.userMessage}`),
    title: "Proposta inicial para revisao",
    summary:
      "Identifiquei um pedido que pode virar configuracao estruturada. Esta proposta ainda e somente leitura.",
    mode: "review_only",
    confidence: "low",
    actions,
    nextQuestions: [
      "Qual workflow deve receber esta configuracao?",
      "Isso deve criar algo novo ou ajustar uma estrutura existente?",
      "Qual e o destino operacional esperado no Airtable?",
    ],
    governance: {
      requiresHumanApproval: true,
      canApplyAutomatically: false,
      reason:
        "Fallback local: a proposta foi inferida pelo frontend quando a IA nao retornou JSON estruturado.",
    },
  } satisfies SetupCopilotProposal;
}

export function buildSetupCopilotStructuredMessage(userMessage: string) {
  const protocol = [
    "Instrucoes internas da rota autenticada Sunbeat:",
    "Responda em portugues do Brasil, com foco operacional.",
    "Quando o pedido envolver criar ou alterar formulario, tabela, workflow, campo, Airtable ou sync, inclua ao final um bloco JSON revisavel.",
    "Nao diga que aplicou mudancas. O modo atual e somente revisao humana.",
    "Para type=configure_airtable, preencha target.workflowType e um patch executavel quando houver informacao suficiente.",
    "Patch Airtable aceito: { \"airtable_sync_enabled\": true, \"airtable\": { \"table_override\": \"[V2] - Pessoas\" } }.",
    "Se faltar workflow_type, nome de tabela ou base, use status=needs_input e patch=null.",
    "O bloco deve usar exatamente este formato:",
    "```sunbeat-proposal",
    JSON.stringify(
      {
        title: "Titulo curto",
        summary: "Resumo da proposta",
        confidence: "low|medium|high",
        actions: [
          {
            type: "draft_form_schema|draft_table_schema|configure_airtable|adjust_field|create_workflow|review_sync|clarify",
            title: "Acao sugerida",
            description: "O que sera preparado",
            target: {
              workspaceSlug: "workspace",
              workflowType: "workflow_type opcional",
              formSlug: "form opcional",
              tableName: "tabela opcional",
            },
            status: "suggested|needs_input|blocked",
            risk: "low|medium|high",
            requiresConfirmation: true,
            patch: null,
            warnings: ["Risco ou cuidado operacional"],
          },
        ],
        nextQuestions: ["Pergunta objetiva se faltar dado"],
        governance: {
          reason:
            "A IA sugere configuracoes, mas a aplicacao exige confirmacao humana.",
        },
      },
      null,
      2
    ),
    "```",
    "Se o pedido for apenas uma pergunta explicativa, nao inclua o bloco JSON.",
  ].join("\n");

  return `${userMessage.trim()}\n\n---\n${protocol}`;
}
