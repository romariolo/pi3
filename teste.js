const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('O servidor de teste está funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
});