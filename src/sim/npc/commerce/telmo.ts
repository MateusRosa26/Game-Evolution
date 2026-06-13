import type { NpcCommerce } from "./index";

// Telmo — taverneiro (Taverna do Cais): comércio LEVE/opcional — bebida + comida
// simples, sem gating (taverna sempre aberta). Não compete com o Bartolo
// (estalagem = pratos/sustain de rotina); o Telmo é a parada de beira de cais.
//
// Por ora vende só o que TEM template: Pão (saciador barato, mesmo preço da Nina
// e do Bartolo — vendor floor de utilitário). A BEBIDA (cerveja/hidromel) entra
// quando o template de bebida nascer (1a) — fica ✏️ aqui pra não inventar item.
// Não compra nada (é taverna, não casa de penhores). Preços ✏️ Balancista.
export const telmo: NpcCommerce = {
  sells: [
    { templateId: "pao", price: 2 },
    // ✏️ + bebida (cerveja/hidromel) quando o template de bebida entrar (1a).
  ],
  buys: [],
};
