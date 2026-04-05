const { getEmbedding } = require('./src/services/embeddings.service');

async function test() {
  console.log('--- LOCAL EMBEDDING TEST ---');
  const text = 'Hello world';
  const vec = await getEmbedding(text);
  console.log('Vector length:', vec.length);
  if (vec.length === 384) {
    console.log('SUCCESS: Generated 384-dimensional vector.');
  } else {
    console.error('FAILURE: Unexpected vector length', vec.length);
    process.exit(1);
  }
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
