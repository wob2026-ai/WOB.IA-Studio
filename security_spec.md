# Especificação de Segurança Firestore - Explica+ (Security Spec)

Este documento estabelece as leis de integridade, identidade e estado que governam o acesso ao banco de dados Firestore para a solução **Explica+**, de acordo com as melhores práticas de arquitetura Zero-Trust.

---

## 1. Cores e Invariantes de Dados (Data Invariants)

Para garantir segurança rigorosa e evitar atualizações de bypass (Update-Gaps), especificamos as seguintes regras fundamentais:

*   **Identidade Própria**: Um usuário do tipo técnico (`tech`) ou consultor (`commercial`) só pode registrar avaliações e logs sob seu próprio UID.
*   **Imutabilidade de Histórico**: Registros de avaliação (`evaluations`) e logs de acesso (`accesses`) são permanentes e, uma vez criados de forma síncrona com o timestamp do servidor, não podem sofrer qualquer tipo de alteração (update é bloqueado).
*   **Níveis de Acesso (RBAC)**: Apenas administradores (`admin` e `superadmin`) possuem a permissão para gerenciar a coleção de usuários (`users`), criar novos técnicos e atualizar dados administrativos sensíveis.
*   **Controle de Entrada (User Registration)**: Dados sensíveis de perfil (como cargo `role`) só podem ser gravados ou alterados por administradores. Técnicos não podem escalar seus próprios privilégios.

---

## 2. A Lista de Cargas Maliciosas ("Dirty Dozen" Payloads)

Testes de segurança simulados para validar a robustez de nossas regras de segurança Firestore. Cada um dos cenários abaixo deve retornar obrigatoriamente `PERMISSION_DENIED`:

1.  **Ataque de Escala de Privilégio (Self-Promotion)**: Usuário comum tenta criar ou atualizar seu documento em `users/{userId}` trocando sua role para `superadmin`.
2.  **Injeção de Identidade Alheia (Spoofing)**: Usuário autenticado como `UID_123` tenta salvar uma avaliação na coleção `evaluations` com o campo `userId` preenchido como `UID_999`.
3.  **Alteração de Nota Retroativa (Score Bypass)**: Um técnico tenta atualizar uma avaliação existente para mudar sua nota `score` de 45 para 100.
4.  **Bypass do Provedor de Identidade (Email Spoofing)**: Usuário autenticado que não possui o e-mail verificado (`email_verified == false`) tenta acessar dados restritos que exigem verificação de e-mail corporativo.
5.  **Poluição de Identificadores (ID Poisoning/Resource Poisoning)**: Usuário tenta criar um documento com ID no formato incompatível com o padrão do sistema (como um ID de 2MB com caracteres de controle).
6.  **Adulteração de Data de Criação (Timestamp Spoofing)**: Tentativa de forçar o campo `createdAt` de um novo usuário para uma data no passado em vez do carimbo de data/hora oficial do servidor (`request.time`).
7.  **Inclusão de Campos Fantasma (Ghost Fields)**: Tentativa de atualizar o perfil de usuário incluindo chaves que não existem na especificação ("isVerified": true) tirando proveito de ausência de restrição de propriedades.
8.  **Leitura Irrestrita de Perfis de Terceiros (PII Exposure)**: Um técnico logado tenta ler a coleção inteira de usuários sem o filtro pelo seu próprio identificador (Get ou list amplo sem regras de propriedade).
9.  **Exclusão de Log de Acesso (Audit Truncation)**: Técnico tenta apagar um log na coleção `accesses` para esconder seu horário de login ou localidade.
10. **Injeção de Texto Gigante em Nota (Denial of Wallet)**: Usuário envia uma simulação com um campo `transcript` com tamanho superior a 500KB para estourar o armazenamento e estourar cota.
11. **Bypass de Estado de Tentativa (Status Shortcutting)**: Usuário altera o status do fluxo de simulação (`attempts`) de `abandoned` de volta para `completed` de maneira irregular.
12. **Criação de Registro Órfão (Relational Integrity Bypass)**: Criação de uma avaliação `evaluations` referenciando um `userId` inexistente no banco.

---

## 3. Modelo de Testes Automatizados (Test Suite Structure)

Para fins de validação no ambiente de CI/CD, os testes de segurança do Firestore usam `@firebase/rules-unit-testing`, garantindo que todas as requisições que violem as regras acima falhem sob todos os ângulos:

```typescript
// firestore.rules.test.ts (Cenário Conceitual)
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('Deve rejeitar escalação de privilégio em /users/{userId}', async () => {
    const db = (await initializeTestEnvironment({ projectId: 'explica-plus' })).authenticatedContext('tech_user').firestore();
    const docRef = db.collection('users').doc('tech_user');
    await assertFails(docRef.update({ role: 'superadmin' }));
  });

  it('Deve rejeitar injeção de ID corporativo diferente em /evaluations/{evalId}', async () => {
    const db = (await initializeTestEnvironment({ projectId: 'explica-plus' })).authenticatedContext('tech_user').firestore();
    const docRef = db.collection('evaluations').doc('eval_456');
    await assertFails(docRef.set({
      id: 'eval_456',
      userId: 'outromembro', // Viola invariant
      userName: 'Técnico Infiltrado',
      score: 95
    }));
  });
});
```
