// Importa las funciones necesarias desde tu módulo de lectura Modbus
import {
  readHoldingRegisters,
  readCoils,
  read32BitHoldingRegister,
  readSignedHoldingRegister,
  // Asegúrate de tener estas funciones implementadas en modbusRead.js si las necesitas:
  // readDiscreteInputs,
  // readInputRegisters,
} from "./src/functions/modbusRead.js";

/*
  GUÍA RÁPIDA DE DIRECCIONES MODBUS Y TIPOS DE DATOS:

  - Coils (Salidas discretas, R/W):
    - Prefijo: 0 (ej. 00001, 0xxxx)
    - Función típica: readCoils / writeCoil / writeCoils
    - Dato: Booleano (ON/OFF)

  - Discrete Inputs (Entradas discretas, R-Only):
    - Prefijo: 1 (ej. 10001, 1xxxx)
    - Función típica: readDiscreteInputs
    - Dato: Booleano (ON/OFF)

  - Input Registers (Registros de entrada, R-Only, 16-bit):
    - Prefijo: 3 (ej. 30001, 3xxxx)
    - Función típica: readInputRegisters
    - Dato: Entero sin signo de 16 bits (0-65535) o datos específicos del dispositivo.

  - Holding Registers (Registros de retención, R/W, 16-bit):
    - Prefijo: 4 (ej. 40001, 4xxxx)
    - Función típica: readHoldingRegisters / writeRegister / writeRegisters
    - Dato: Entero sin signo de 16 bits (0-65535) por defecto, o con signo, flotante, etc.,
            dependiendo de cómo se interpreten (pueden requerir leer 2 registros para 32 bits).

  NOTA: Los prefijos (0, 1, 3, 4) son una convención común en HMI/SCADA para diferenciar
  el tipo de dato, pero en la comunicación Modbus real, solo se usa la dirección numérica
  (ej. para leer el coil 00001, se pide la dirección 0; para el holding register 40001, se pide la dirección 0).
  Tus funciones probablemente ya manejan esta abstracción, esperando la dirección "real"
  (ej. 1631 para el holding register 41632).
*/

async function main() {
  // --- CONFIGURACIÓN MODIFICABLE POR EL USUARIO ---
  const ipPLC = "192.168.0.130"; // Cambia la IP del PLC aquí
  const puertoModbus = 502;
  const idEsclavo = 1;

  // Define la dirección Modbus que quieres leer (sin el prefijo de tipo)
  // Por ejemplo, si en tu HMI es "40101", aquí pones 100 (o 101 si es 1-based).
  // Consulta la documentación de tu PLC para el mapeo exacto.
  // Las direcciones suelen ser 0-based en el protocolo.
  const direccionAModificar = 1643; // Ejemplo: para leer el registro 41632 (si es 1-based) o 41631 (si es 0-based)

  console.log(
    `Conectando a PLC: ${ipPLC}:${puertoModbus}, Esclavo ID: ${idEsclavo}`
  );
  console.log(`Intentando leer la dirección: ${direccionAModificar}`);
  console.log("----------------------------------------------------");

  try {
    // --- DESCOMENTA EL TIPO DE LECTURA QUE NECESITES ---

    // **1. Leer un Coil (Prefijo 0 o 0xxxx)**
    // Ejemplo: leer el coil en la dirección `direccionAModificar`
    /*
    const valorCoil = await readCoils(ipPLC, puertoModbus, idEsclavo, direccionAModificar);
    if (valorCoil !== null && valorCoil.length > 0) {
      console.log(`Valor del Coil ${direccionAModificar}: ${valorCoil[0]}`); // Típicamente true/false
    } else {
      console.log(`No se pudo leer el Coil ${direccionAModificar}.`);
    }
    */

    // **2. Leer un Discrete Input (Prefijo 1 o 1xxxx)**
    // Asumiendo que tienes una función `readDiscreteInputs` similar a `readCoils`.
    // Si no la tienes, deberás implementarla en `./src/functions/modbusRead.js`
    /*
    const valorDiscreteInput = await readDiscreteInputs(ipPLC, puertoModbus, idEsclavo, direccionAModificar);
    if (valorDiscreteInput !== null && valorDiscreteInput.length > 0) {
      console.log(`Valor del Discrete Input ${direccionAModificar}: ${valorDiscreteInput[0]}`); // Típicamente true/false
    } else {
      console.log(`No se pudo leer el Discrete Input ${direccionAModificar}.`);
    }
    */

    // **3. Leer un Input Register (Prefijo 3 o 3xxxx)**
    // Asumiendo que tienes una función `readInputRegisters` similar a `readHoldingRegisters`.
    // Si no la tienes, deberás implementarla en `./src/functions/modbusRead.js`
    /*
    const valorInputRegister = await readInputRegisters(ipPLC, puertoModbus, idEsclavo, direccionAModificar);
    if (valorInputRegister !== null) { // Podría devolver un número o un array, ajusta según tu función
      console.log(`Valor del Input Register ${direccionAModificar} (16-bit): ${valorInputRegister}`);
    } else {
      console.log(`No se pudo leer el Input Register ${direccionAModificar}.`);
    }
    */

    // **4. Leer un Holding Register (Prefijo 4 o 4xxxx)**

    // Ejemplo: leer un registro holding simple (16-bit unsigned)
    const valorHoldingRegister = await readHoldingRegisters(ipPLC, puertoModbus, idEsclavo, direccionAModificar);
    if (valorHoldingRegister !== null) { // Podría devolver un número o un array, ajusta según tu función
      // Si tu función devuelve un array incluso para un solo registro: valorHoldingRegister[0]
      console.log(`Valor del Holding Register ${direccionAModificar} (16-bit unsigned): ${valorHoldingRegister}`);
    } else {
      console.log(`No se pudo leer el Holding Register ${direccionAModificar}.`);
    }


    // Ejemplo: leer un registro holding con signo (16-bit signed)
    /*
    const valorSignedHoldingRegister = await readSignedHoldingRegister(ipPLC, puertoModbus, idEsclavo, direccionAModificar);
    if (valorSignedHoldingRegister !== null) {
      console.log(`Valor del Holding Register ${direccionAModificar} (16-bit signed): ${valorSignedHoldingRegister}`);
    } else {
      console.log(`No se pudo leer el Holding Register con signo ${direccionAModificar}.`);
    }
    */

    // Ejemplo: leer un registro holding de 32 bits (combina dos registros de 16 bits)
    // Para esto, necesitas especificar las dos direcciones de 16 bits que componen el valor de 32 bits.
    // Comúnmente, el valor de 32 bits se almacena en dos registros consecutivos.
    // `direccionBaja` suele ser la dirección del Word Menos Significativo (LSW).
    // `direccionAlta` suele ser la dirección del Word Más Significativo (MSW).
    // El orden (si la dirección alta es `direccionBaja - 1` o `direccionBaja + 1`) depende del PLC.
    // Tu script original usa: lowRegister = 1415 (LSW), highRegister = 1414 (MSW)
    /*
    const direccionBaja32Bit = 1415; // Dirección del LSW (ej. 41416)
    const direccionAlta32Bit = 1414; // Dirección del MSW (ej. 41415)

    // Opciones adicionales podrían ser necesarias para read32BitHoldingRegister, como:
    // { signed: true/false, wordOrder: 'msw_first'/'lsw_first', byteOrder: 'msb_first'/'lsb_first' }
    // Esto depende de cómo esté implementada tu función.
    // Por ejemplo, si quieres leerlo como un entero con signo:
    // const opciones32bit = { signed: true, wordOrder: 'msw_first' }; // Asumiendo que MSW está en la dirección más baja (1414)

    const valor32Bit = await read32BitHoldingRegister(
      ipPLC,
      puertoModbus,
      idEsclavo,
      direccionBaja32Bit, // LSW address
      direccionAlta32Bit  // MSW address
      // , opciones32bit // Opcional, si tu función lo soporta
    );
    if (valor32Bit !== null) {
      console.log(`Valor del Holding Register ${direccionAlta32Bit}-${direccionBaja32Bit} (32-bit): ${valor32Bit}`);
    } else {
      console.log(`No se pudo leer el Holding Register de 32 bits.`);
    }
    */

    console.log("----------------------------------------------------");

  } catch (error) {
    console.error("Error durante la comunicación Modbus:", error.message);
    if (error.code) {
      console.error(`Código de error Modbus (si aplica): ${error.code}`); // Algunas librerías/errores pueden tener un código específico
    }
    if (error.modbusCode) { // node-modbus-serial usa 'modbusCode' para excepciones Modbus
        console.error(`Excepción Modbus (modbusCode): ${error.modbusCode}`);
    }
  }
}

main().catch(console.error); // Captura errores no manejados en la promesa de main