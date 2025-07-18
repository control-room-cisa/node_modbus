import { readHoldingRegisters } from "./src/functions/modbusRead.js";

// Función para convertir dos registros (Big Endian) a un valor de 32 bits float
function convertTo32BitFloatBigEndian(high, low) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(high, 0); // Escribir el valor alto en los primeros 2 bytes
  buffer.writeUInt16BE(low, 2);  // Escribir el valor bajo en los últimos 2 bytes
  return buffer.readFloatBE(0);  // Leer como float de 32 bits en Big Endian
}

async function leerDatosSensor() {
  const ip = "192.168.16.37";
  const port = 502;
  const slaveId = 1;

  // Lectura del valor de flujo (flow)
  const startRegisterFlow = 0; // Registro de inicio para el flujo
  const numRegistersFlow = 2;  // Se leen 2 registros para obtener 32 bits
  const registerValues = await readHoldingRegisters(
    ip,
    port,
    slaveId,
    startRegisterFlow,
    numRegistersFlow
  );

  // Lectura del valor de calidad
  const calidadRegister = 91; // Registro para la calidad
  const calidadRaw = await readHoldingRegisters(ip, port, slaveId, calidadRegister);

  if (registerValues && registerValues.length >= 2) {
    // Los registros se asumen en el orden: [registro bajo, registro alto]
    const lowRegisterValue = registerValues[0];
    const highRegisterValue = registerValues[1];

    // Convertir los dos registros a un float de 32 bits en Big Endian
    const flowRate = convertTo32BitFloatBigEndian(highRegisterValue, lowRegisterValue);

    // Calcular la calidad dividiendo el valor leído entre 10
    const calidad = calidadRaw / 10;

    console.log(`Flow: ${flowRate} m³/h | Calidad: ${calidad}`);
  } else {
    console.error("Error: No se pudieron leer los registros necesarios para el sensor.");
  }
}

// Ejecutar la lectura cada 5 segundos
setInterval(() => {
  leerDatosSensor();
}, 5000);
