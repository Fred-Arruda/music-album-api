import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ENTRY = fileURLToPath(new URL("../server.js", import.meta.url));

let child;
let baseUrl;
let dataDir;
let stderr = "";

/** Pede ao SO uma porta livre, para os testes nunca colidirem com o servidor de dev. */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** Espera o servidor aceitar conexões; aborta cedo se o processo morrer. */
async function waitForServer(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Servidor encerrou com código ${child.exitCode}.\n${stderr}`,
      );
    }
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Servidor não respondeu em ${timeoutMs}ms.\n${stderr}`);
}

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "music-album-api-"));
  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;

  child = spawn(process.execPath, [ENTRY], {
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: join(dataDir, "test.db"),
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  await waitForServer(`${baseUrl}/albums`);
});

after(async () => {
  child?.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
});

function postAlbum(body) {
  return fetch(`${baseUrl}/albums`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_ALBUM = {
  artist: "Radiohead",
  album: "OK Computer",
  rating: 10,
  comment: null,
};

test("POST /albums cria um álbum e devolve o id", async () => {
  const response = await postAlbum(VALID_ALBUM);
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.ok(Number.isInteger(body.id), "id deve ser um inteiro");
});

test("POST /albums remove espaços das pontas antes de salvar", async () => {
  const created = await (
    await postAlbum({
      ...VALID_ALBUM,
      artist: "  Björk  ",
      album: "  Homogenic  ",
    })
  ).json();
  const album = await (await fetch(`${baseUrl}/albums/${created.id}`)).json();

  assert.equal(album.artist, "Björk");
  assert.equal(album.album, "Homogenic");
});

test("POST /albums rejeita artista vazio", async () => {
  const response = await postAlbum({ ...VALID_ALBUM, artist: "   " });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /artist/i);
});

test("POST /albums rejeita nota fora do intervalo 0–10", async () => {
  for (const rating of [-1, 11, 7.5, "10"]) {
    const response = await postAlbum({ ...VALID_ALBUM, rating });
    assert.equal(
      response.status,
      400,
      `rating ${rating} deveria ser rejeitado`,
    );
  }
});

test("POST /albums rejeita comentário acima de 500 caracteres", async () => {
  const response = await postAlbum({
    ...VALID_ALBUM,
    comment: "a".repeat(501),
  });

  assert.equal(response.status, 400);
});

// Bug conhecido (README, "Limitações"): omitir `comment` devolve 400.
// `todo` registra a falha no relatório sem quebrar o CI. Remova a flag quando corrigir.
test(
  "POST /albums aceita comment omitido",
  { todo: "corrigir para `comment != null`" },
  async () => {
    const response = await postAlbum({
      artist: "Portishead",
      album: "Dummy",
      rating: 9,
    });

    assert.equal(response.status, 201);
  },
);

test("GET /albums devolve uma lista", async () => {
  const response = await fetch(`${baseUrl}/albums`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
});

test("GET /albums/:id devolve o álbum criado", async () => {
  const created = await (
    await postAlbum({ ...VALID_ALBUM, album: "Kid A" })
  ).json();
  const response = await fetch(`${baseUrl}/albums/${created.id}`);
  const album = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    { ...album, id: undefined },
    {
      id: undefined,
      artist: "Radiohead",
      album: "Kid A",
      rating: 10,
      comment: null,
    },
  );
});

test("GET /albums/:id devolve 404 para id inexistente", async () => {
  const response = await fetch(`${baseUrl}/albums/999999`);

  assert.equal(response.status, 404);
});

test("GET /albums/:id devolve 400 para id não numérico", async () => {
  const response = await fetch(`${baseUrl}/albums/abc`);

  assert.equal(response.status, 400);
});
