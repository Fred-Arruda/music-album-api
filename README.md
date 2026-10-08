# music-album-api

API REST para registrar álbuns de música com nota e comentário. Node + Express 5 + SQLite.

Foi o primeiro projeto que publiquei no GitHub, construído aos poucos para praticar CRUD, validação de entrada, códigos de status HTTP e persistência em banco de dados.

## Stack

Node.js (ESM) · Express 5 · SQLite (`sqlite` + `sqlite3`)

## Rodando

```
git clone https://github.com/Fred-Arruda/music-album-api
cd music-album-api
npm install
npm start        # http://localhost:3000
npm run dev      # reinicia a cada alteração (node --watch)
```

O arquivo `banco.db` é criado na primeira execução, junto com a tabela `albums`. Ele está no `.gitignore`, então cada pessoa começa com um banco vazio.

## Modelo de dados

Uma tabela, `albums`:

| Coluna    | Tipo    | Restrições                                |
| --------- | ------- | ----------------------------------------- |
| `id`      | INTEGER | chave primária, autoincremento            |
| `artist`  | TEXT    | obrigatório                               |
| `album`   | TEXT    | obrigatório                               |
| `rating`  | INTEGER | obrigatório, `CHECK` entre 0 e 10         |
| `comment` | TEXT    | opcional (até 500 caracteres, via a API)  |

## Rotas

Todas as rotas ficam sob o prefixo `/albums`.

| Método | Rota          | Body                                       | Respostas              |
| ------ | ------------- | ------------------------------------------ | ---------------------- |
| POST   | `/albums`     | `{ artist, album, rating, comment? }`      | 201 / 400 / 500        |
| GET    | `/albums`     | —                                          | 200 / 500              |
| GET    | `/albums/:id` | —                                          | 200 / 400 / 404 / 500  |

### Regras de validação (POST)

- `artist` e `album`: texto não vazio (espaços nas pontas são removidos).
- `rating`: número inteiro de 0 a 10.
- `comment`: texto de até 500 caracteres ou `null`. Comentário vazio ou só com espaços é salvo como `NULL`.

Os erros vêm sempre como `{ "error": "mensagem" }`.

### Exemplos

```
# criar um álbum
curl -X POST localhost:3000/albums \
  -H 'content-type: application/json' \
  -d '{"artist":"Radiohead","album":"OK Computer","rating":10,"comment":null}'
# 201  {"id":1,"message":"Album create successfully."}

# nota fora do intervalo
curl -X POST localhost:3000/albums \
  -H 'content-type: application/json' \
  -d '{"artist":"Radiohead","album":"OK Computer","rating":11,"comment":null}'
# 400  {"error":"Rating must be between 0 and 10"}

# listar todos
curl localhost:3000/albums

# buscar um
curl localhost:3000/albums/1
# 200  {"id":1,"artist":"Radiohead","album":"OK Computer","rating":10,"comment":null}

curl localhost:3000/albums/999
# 404  {"error":"Album not found."}
```

## Organização

```
server.js                 cria o app, inicializa o banco e abre a porta 3000
routes/albuns.js          rotas de /albums: validação + SQL
database/connection.js    abre o banco.db e cria a tabela
```

## Decisões

**Por que SQLite?** É um arquivo só, sem servidor para instalar. Para um projeto de aprendizado, deixa o foco na API e no SQL, e não na infraestrutura.

**Por que validar a nota duas vezes?** A rota rejeita nota inválida com uma mensagem clara (400), e a tabela tem um `CHECK` entre 0 e 10 como última linha de defesa. Se um dia outra parte do código gravar no banco sem passar pela rota, a regra continua valendo.

**Por que consultas parametrizadas?** Todo valor vindo do cliente entra no SQL por `?`, nunca por concatenação de texto. Isso evita injeção de SQL.

**Por que o banco inicia antes da porta abrir?** O `server.js` espera `initializeDatabase()` terminar antes de chamar `listen`. Se a criação da tabela falhar, o processo encerra com erro em vez de subir uma API que não funciona.

## Limitações conhecidas

- Só cria e lê álbuns: ainda não há atualizar nem apagar.
- Não há testes automatizados (`npm test` ainda é o padrão do `npm init`).
- O tratamento de erros é feito rota por rota, e as mensagens não seguem um padrão único (algumas com ponto final, algumas sem; `GET /albums` devolve a mensagem crua do erro do banco).
- Omitir o campo `comment` no POST devolve 400; é preciso enviar `"comment": null`.
- A porta é fixa (3000) e `GET /albums` não tem paginação.

## Próximos passos

- `PUT /albums/:id` e `DELETE /albums/:id`
- aceitar `comment` omitido
- middleware central de erros com formato único, como no [mygit-api](https://github.com/Fred-Arruda/mygit-api)
- testes com `node:test`, subindo o servidor de verdade
- porta por variável de ambiente (`PORT`)
- paginação e filtro por artista e por nota
- as entidades Artista e Nota planejadas no início do projeto

## Licença

ISC (conforme o `package.json`).
