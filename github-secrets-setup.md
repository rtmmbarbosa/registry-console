# GitHub Actions Secrets Setup

Para o workflow funcionar corretamente, precisas configurar os seguintes secrets no GitHub:

## 1. Aceder às Settings do Repository

1. Vai ao teu repositório: `https://github.com/rtmmbarbosa/registry-console`
2. Clica em **Settings** (tab no topo)
3. Na barra lateral esquerda, clica em **Secrets and variables** > **Actions**

## 2. Adicionar os Secrets

Clica em **New repository secret** e adiciona:

### DOCKER_USERNAME
- **Name**: `DOCKER_USERNAME`
- **Value**: `rubenmacedobarbosa` (o teu username do Docker Hub)

### DOCKER_PASSWORD  
- **Name**: `DOCKER_PASSWORD`
- **Value**: `[a tua password do Docker Hub]`

**Nota**: Se usares 2FA no Docker Hub, precisas criar um Access Token em vez da password:
1. Vai a Docker Hub > Account Settings > Security > Access Tokens
2. Cria um novo token com permissões de Read & Write
3. Usa esse token como `DOCKER_PASSWORD`

**Para ti (rubenmacedobarbosa@gmail.com):**
- O teu username do Docker Hub é provavelmente `rubenmacedobarbosa`
- Se não tiveres conta no Docker Hub, cria uma em https://hub.docker.com

## 3. Verificar os Secrets

Após adicionar, deves ver na lista:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## 4. Workflow Atualizado

O workflow agora:
- Usa o Docker Hub (registry público gratuito)
- Faz push para `rubenmacedobarbosa/registry-console:latest`
- Mantém todos os testes antes do build
- Funciona sem problemas de permissões

## 5. Próximo Push

Quando fizeres o próximo push, o workflow:
1. Executa os testes
2. Se testes passarem, faz build
3. Faz push para o Docker Hub

**Benefícios do Docker Hub:**
- ✅ Gratuito para repositórios públicos
- ✅ Sem problemas de permissões organizacionais
- ✅ Amplamente usado pela comunidade
- ✅ Fácil de usar por outros developers

A imagem ficará disponível em: `docker pull rubenmacedobarbosa/registry-console:latest` 🎉
