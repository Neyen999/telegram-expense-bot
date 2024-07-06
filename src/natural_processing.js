const natural = require('natural');
const fs = require('fs');

const tokenizer = new natural.WordTokenizer();
let classifier = new natural.BayesClassifier();

// Función para entrenar y guardar el clasificador
function trainAndSaveClassifier() {
  // Agregar todos los documentos de entrenamiento
  classifier.addDocument('Compré ropa por 50000 pesos', 'gasto');
  classifier.addDocument('Vendí mi bicicleta vieja por 100000 pesos', 'ingreso');
  classifier.addDocument('Pagué 25000 pesos de luz', 'gasto');
  classifier.addDocument('Me devolvieron 15000 pesos de un producto', 'ingreso');
  classifier.addDocument('Invertí 200000 pesos en acciones', 'gasto');
  classifier.addDocument('Gané 75000 pesos en un concurso', 'ingreso');
  classifier.addDocument('Gasté 8000 pesos en el cine', 'gasto');
  classifier.addDocument('Cobré 30000 pesos por un trabajo freelance', 'ingreso');
  classifier.addDocument('Pagué 40000 pesos de cuota del gimnasio', 'gasto');
  classifier.addDocument('Recibí un reembolso de 60000 pesos', 'ingreso');

  // Entrenar el clasificador
  classifier.train();

  // Guardar el clasificador entrenado
  classifier.save('trained_classifier.json', function(err, classifier) {
    if (err) {
      console.error(err);
    } else {
      console.log('Clasificador guardado exitosamente.');
    }
  });
}

// Función para cargar el clasificador entrenado
function loadClassifier(callback) {
  natural.BayesClassifier.load('trained_classifier.json', null, function(err, loadedClassifier) {
    if (err) {
      console.error('Error al cargar el clasificador:', err);
      // Si hay un error al cargar, entrenamos y guardamos uno nuevo
      trainAndSaveClassifier();
      callback(classifier);
    } else {
      console.log('Clasificador cargado exitosamente.');
      classifier = loadedClassifier;
      callback(classifier);
    }
  });
}

// Función para procesar el mensaje
function processMessage(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Buscar el monto
  const amount = tokens.find(token => !isNaN(parseFloat(token)));
  
  // Clasificar el tipo de transacción
  const type = classifier.classify(text);
  
  // Extraer la descripción (todo lo que no sea el monto ni palabras comunes)
  const commonWords = ['en', 'por', 'para', 'de', 'el', 'la', 'los', 'las'];
  const description = tokens
    .filter(token => token !== amount && !commonWords.includes(token))
    .join(' ');

  return {
    amount: amount ? parseFloat(amount) : null,
    type: type,
    description: description
  };
}

// Inicializar el clasificador
if (fs.existsSync('trained_classifier.json')) {
  loadClassifier(function(loadedClassifier) {
    classifier = loadedClassifier;
    console.log('Clasificador listo para usar.');
  });
} else {
  trainAndSaveClassifier();
}


trainAndSaveClassifier();

module.exports = { processMessage };