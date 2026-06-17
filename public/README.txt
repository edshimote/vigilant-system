SITE LUMIÉ BEAUTY SCHOOL - Curso de Aparência, Estilo e Físico

Como usar:
1. Abra index.html no navegador.
2. Para entrar como ADM, clique em "Já tenho Chave de Ativação / criar conta" e use:
   Email: suporte@lumie.com
   Senha: 1076ks.mn
3. No painel adm.html, gere uma Chave Semanal de 7 dias ou uma Chave Vitalícia.
4. Envie a chave criada para o aluno.
5. O aluno cria a conta usando essa chave e entra em dashboard.html.

Correções desta versão:
- Corrigido erro que quebrava o script no carregamento por iniciar o ADM antes das funções de conta existirem.
- Adicionado painel ADM para gerar chave semanal e chave vitalícia.
- Bloqueado cadastro com chave aleatória: agora a chave precisa existir na lista criada/liberada.
- Chaves usadas ficam marcadas e não podem ativar outra conta.
- Valores alinhados: semanal R$22,90 e vitalícia R$97,00.
- Corrigida a consulta do Mercado Pago para verificar payments em vez de orders.
- Corrigido link de pagamento PIX para usar ticket_url quando disponível.
- Ajustes visuais no painel ADM para mobile e desktop.
- As chaves criadas pelo ADM também tentam ser salvas no Firebase Realtime Database usado pelo chat, para funcionar entre dispositivos quando as regras do Firebase permitirem.

Observação importante:
Este projeto ainda usa localStorage para contas e fallback das chaves. Isso é suficiente para protótipo/teste visual, mas não é a segurança ideal para venda real. Para vender de verdade, o correto é validar chaves, contas e pagamentos em backend/banco de dados com regras de segurança, como Supabase, Firebase Auth/Firestore, PlanetScale, Neon ou outro servidor.
