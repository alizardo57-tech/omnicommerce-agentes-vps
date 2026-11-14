const MAX_CONCORRENCIA = 3;
let emExecucao = 0;
const fila = [];

function enfileirarExecucao(fn) {
  return new Promise((resolve, reject) => {
    fila.push({ fn, resolve, reject });
    processarProximo();
  });
}

function processarProximo() {
  if (emExecucao >= MAX_CONCORRENCIA || fila.length === 0) return;
  const item = fila.shift();
  emExecucao++;
  Promise.resolve()
    .then(() => item.fn())
    .then(res => item.resolve(res))
    .catch(err => item.reject(err))
    .finally(() => {
      emExecucao--;
      processarProximo();
    });
}

function obterStatusFila() {
  return { emExecucao, aguardandoNaFila: fila.length, maxConcorrencia: MAX_CONCORRENCIA };
}

module.exports = { enfileirarExecucao, obterStatusFila };
