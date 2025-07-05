# Migração para MySQL

Este projeto foi migrado do PostgreSQL para MySQL usando Drizzle ORM.

## Configuração

1. **Instale o MySQL** (se ainda não tiver):
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   
   # macOS
   brew install mysql
   ```

2. **Inicie o MySQL**:
   ```bash
   sudo systemctl start mysql
   # ou
   brew services start mysql
   ```

3. **Configure o banco de dados**:
   ```sql
   CREATE DATABASE politic_mind;
   CREATE USER 'politic_user'@'localhost' IDENTIFIED BY 'sua_senha_aqui';
   GRANT ALL PRIVILEGES ON politic_mind.* TO 'politic_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Configure a variável de ambiente**:
   Crie ou atualize o arquivo `.env.local`:
   ```env
   MYSQL_URL=mysql://politic_user:sua_senha_aqui@localhost:3306/politic_mind
   ```

## Migração

1. **Execute as migrações**:
   ```bash
   pnpm db:migrate
   ```

2. **Verifique se tudo está funcionando**:
   ```bash
   pnpm dev
   ```

## Principais Mudanças

- **Schema**: Migrado de `pg-core` para `mysql-core`
- **IDs**: Mudou de `uuid` para `varchar(36)` com `nanoid()`
- **Tipos**: `integer` → `int`, `pgTable` → `mysqlTable`
- **Conexão**: `postgres-js` → `mysql2`
- **Dependências**: Removido `@vercel/postgres` e `postgres`, adicionado `mysql2`

## Comandos Úteis

```bash
# Gerar novas migrações
pnpm db:generate

# Executar migrações
pnpm db:migrate

# Ver banco no Drizzle Studio
pnpm db:studio

# Fazer push das mudanças (desenvolvimento)
pnpm db:push
``` 