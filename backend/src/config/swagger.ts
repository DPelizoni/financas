import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Finanças Pessoais",
      version: "1.0.0",
      description:
        "API REST para gerenciamento de finanças pessoais com CRUD de bancos, transações e categorias.",
      contact: {
        name: "Suporte",
        email: "suporte@financas.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor de Desenvolvimento",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Operações de autenticação e sessão de usuários",
      },
      {
        name: "Banks",
        description:
          "Operações relacionadas a bancos e instituições financeiras",
      },
      {
        name: "Categories",
        description:
          "Operações relacionadas às categorias de receita e despesa",
      },
      {
        name: "Descrições",
        description: "Operações relacionadas às descrições por categoria",
      },
      {
        name: "Transações",
        description:
          "Operações relacionadas ao lançamento e gestão de transações",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT no formato Bearer",
        },
      },
      schemas: {
        UserPublic: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            nome: {
              type: "string",
              example: "Maria Silva",
            },
            email: {
              type: "string",
              example: "maria@empresa.com",
            },
            status: {
              type: "string",
              enum: ["ATIVO", "INATIVO"],
              example: "ATIVO",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        AuthSession: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "Token JWT de autenticação",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            usuario: {
              $ref: "#/components/schemas/UserPublic",
            },
          },
        },
        AuthRegisterInput: {
          type: "object",
          required: ["nome", "email", "senha"],
          properties: {
            nome: {
              type: "string",
              example: "Maria Silva",
            },
            email: {
              type: "string",
              example: "maria@empresa.com",
            },
            senha: {
              type: "string",
              example: "123456",
            },
            status: {
              type: "string",
              enum: ["ATIVO", "INATIVO"],
              example: "ATIVO",
            },
          },
        },
        AuthLoginInput: {
          type: "object",
          required: ["email", "senha"],
          properties: {
            email: {
              type: "string",
              example: "maria@empresa.com",
            },
            senha: {
              type: "string",
              example: "123456",
            },
          },
        },
        Bank: {
          type: "object",
          required: ["nome"],
          properties: {
            id: {
              type: "integer",
              description: "ID único do banco",
              example: 1,
            },
            nome: {
              type: "string",
              description: "Nome do banco",
              example: "Nubank",
            },
            codigo: {
              type: "string",
              description: "Código do banco",
              example: "260",
              nullable: true,
            },
            cor: {
              type: "string",
              description: "Cor em hexadecimal para identificação visual",
              example: "#8B10AE",
              default: "#3B82F6",
            },
            icone: {
              type: "string",
              description: "URL ou nome do ícone",
              example: "bank-icon",
              nullable: true,
            },
            saldo_inicial: {
              type: "number",
              format: "decimal",
              description: "Saldo inicial da conta",
              example: 1000.0,
              default: 0.0,
            },
            ativo: {
              type: "boolean",
              description: "Status do banco (ativo/inativo)",
              example: true,
              default: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Data de criação",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              description: "Data de atualização",
            },
          },
        },
        BankInput: {
          type: "object",
          required: ["nome"],
          properties: {
            nome: {
              type: "string",
              description: "Nome do banco",
              example: "Nubank",
            },
            codigo: {
              type: "string",
              description: "Código do banco",
              example: "260",
            },
            cor: {
              type: "string",
              description: "Cor em hexadecimal",
              example: "#8B10AE",
            },
            icone: {
              type: "string",
              description: "URL ou nome do ícone",
              example: "bank-icon",
            },
            saldo_inicial: {
              type: "number",
              format: "decimal",
              description: "Saldo inicial",
              example: 1000.0,
            },
            ativo: {
              type: "boolean",
              description: "Status do banco",
              example: true,
            },
          },
        },
        Category: {
          type: "object",
          required: ["nome", "tipo"],
          properties: {
            id: {
              type: "integer",
              description: "ID único da categoria",
              example: 1,
            },
            nome: {
              type: "string",
              description: "Nome da categoria",
              example: "Alimentação",
            },
            tipo: {
              type: "string",
              enum: ["RECEITA", "DESPESA"],
              description: "Tipo da categoria",
              example: "DESPESA",
            },
            cor: {
              type: "string",
              description: "Cor em hexadecimal",
              example: "#0EA5E9",
            },
            ativo: {
              type: "boolean",
              description: "Status da categoria",
              example: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CategoryInput: {
          type: "object",
          required: ["nome", "tipo"],
          properties: {
            nome: {
              type: "string",
              description: "Nome da categoria",
              example: "Alimentação",
            },
            tipo: {
              type: "string",
              enum: ["RECEITA", "DESPESA"],
              description: "Tipo da categoria",
              example: "DESPESA",
            },
            cor: {
              type: "string",
              description: "Cor da categoria",
              example: "#0EA5E9",
            },
            ativo: {
              type: "boolean",
              description: "Status da categoria",
              example: true,
            },
          },
        },
        Descricao: {
          type: "object",
          required: ["nome", "categoria_id"],
          properties: {
            id: {
              type: "integer",
              description: "ID único da descrição",
              example: 1,
            },
            nome: {
              type: "string",
              description: "Nome da descrição",
              example: "Supermercado",
            },
            categoria_id: {
              type: "integer",
              description: "ID da categoria vinculada",
              example: 3,
            },
            ativo: {
              type: "boolean",
              description: "Status da descrição",
              example: true,
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        DescricaoInput: {
          type: "object",
          required: ["nome", "categoria_id"],
          properties: {
            nome: {
              type: "string",
              description: "Nome da descrição",
              example: "Supermercado",
            },
            categoria_id: {
              type: "integer",
              description: "ID da categoria vinculada",
              example: 3,
            },
            ativo: {
              type: "boolean",
              description: "Status da descrição",
              example: true,
            },
          },
        },
        Transacao: {
          type: "object",
          required: [
            "mes",
            "vencimento",
            "tipo",
            "categoria_id",
            "descricao_id",
            "banco_id",
            "situacao",
            "valor",
          ],
          properties: {
            id: {
              type: "integer",
              description: "ID único da transação",
              example: 1,
            },
            mes: {
              type: "string",
              description: "Mês de referência da transação",
              example: "03/2026",
            },
            vencimento: {
              type: "string",
              description: "Data de vencimento",
              example: "15/03/2026",
            },
            tipo: {
              type: "string",
              enum: ["DESPESA", "RECEITA"],
              description: "Tipo da transação",
              example: "DESPESA",
            },
            categoria_id: {
              type: "integer",
              description: "ID da categoria",
              example: 3,
            },
            descricao_id: {
              type: "integer",
              description: "ID da descrição",
              example: 12,
            },
            banco_id: {
              type: "integer",
              description: "ID do banco",
              example: 2,
            },
            situacao: {
              type: "string",
              enum: ["PENDENTE", "PAGO"],
              description: "Situação da transação",
              example: "PENDENTE",
            },
            valor: {
              type: "number",
              format: "decimal",
              description: "Valor da transação",
              example: 249.9,
            },
            categoria_nome: {
              type: "string",
              nullable: true,
              description: "Nome da categoria (quando retornado com join)",
              example: "Alimentação",
            },
            descricao_nome: {
              type: "string",
              nullable: true,
              description: "Nome da descrição (quando retornado com join)",
              example: "Supermercado",
            },
            banco_nome: {
              type: "string",
              nullable: true,
              description: "Nome do banco (quando retornado com join)",
              example: "Nubank",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        TransacaoInput: {
          type: "object",
          required: [
            "mes",
            "vencimento",
            "tipo",
            "categoria_id",
            "descricao_id",
            "banco_id",
            "valor",
          ],
          properties: {
            mes: {
              type: "string",
              description: "Mês de referência da transação",
              example: "03/2026",
            },
            vencimento: {
              type: "string",
              description: "Data de vencimento",
              example: "15/03/2026",
            },
            tipo: {
              type: "string",
              enum: ["DESPESA", "RECEITA"],
              description: "Tipo da transação",
              example: "DESPESA",
            },
            categoria_id: {
              type: "integer",
              description: "ID da categoria",
              example: 3,
            },
            descricao_id: {
              type: "integer",
              description: "ID da descrição",
              example: 12,
            },
            banco_id: {
              type: "integer",
              description: "ID do banco",
              example: 2,
            },
            situacao: {
              type: "string",
              enum: ["PENDENTE", "PAGO"],
              description: "Situação da transação",
              example: "PENDENTE",
            },
            valor: {
              type: "number",
              format: "decimal",
              description: "Valor da transação",
              example: 249.9,
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 57,
            },
            totalPages: {
              type: "integer",
              example: 6,
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Erro ao processar requisição",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },
      },
    },
  },
  apis: [
    path.resolve(process.cwd(), "src/routes/*.ts"),
    path.resolve(__dirname, "../routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
