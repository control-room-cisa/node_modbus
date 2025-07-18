import {  insertarFlowSensorPt } from "../main_sql_local/src/controllers/flowsensors.js";
import { obtenerUltimoNivelTabla } from "../main_sql_local/src/controllers/queries.js";
import { readHoldingRegisters } from "./src/functions/modbusRead.js";
import cron from "cron";

// Función para convertir dos registros (Big Endian) a un valor de 32 bits float
function convertTo32BitFloatBigEndian(high, low) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(high, 0); // Escribir el valor alto en los primeros 2 bytes
  buffer.writeUInt16BE(low, 2); // Escribir el valor bajo en los últimos 2 bytes
  return buffer.readFloatBE(0); // Leer como float de 32 bits en Big Endian
}

async function main() {
  const ip = "192.168.16.37";
  const port = 502;
  const slaveId = 1;

  // Configuración para leer los registros correctos que representan el Flow Rate
  const startRegister = 0; // Dirección de inicio para lectura, registro 0 basado en el índice
  const numRegisters = 2; // Leer 2 registros para obtener el valor de 32 bits

  // Leer registros de Modbus
  const registerValues = await readHoldingRegisters(
    ip,
    port,
    slaveId,
    startRegister,
    numRegisters
  );
  const calidadRaw = await readHoldingRegisters(ip, port, slaveId, 91);

  if (registerValues && registerValues.length >= 2) {
    const lowRegisterValue = registerValues[0]; // Primer valor leído (registro bajo)
    const highRegisterValue = registerValues[1]; // Segundo valor leído (registro alto)

    // Conversión a float de 32 bits en Big Endian
    let flowRate_m3_h = convertTo32BitFloatBigEndian(
      highRegisterValue,
      lowRegisterValue
    );
    
    // Verificar si el valor es negativo y cambiarlo a 0 si es así
    if (flowRate_m3_h < 0) {
      console.log(`Flow Rate negativo detectado: ${flowRate_m3_h} m³/h, cambiando a 0`);
      flowRate_m3_h = 0;
    }
    
    const calidad = calidadRaw / 10; // Calcular la calidad como calidadRaw dividido entre 10

    console.log(
      `Flow Rate (Big Endian) leído del sensor: ${flowRate_m3_h} m³/h`
    );
    console.log(`Calidad del sensor (Register 91): ${calidad}`);
    let nivel = null;
    try {
      nivel = await obtenerUltimoNivelTabla("nivelpt"); // Puedes cambiar 'nivelpt' por el nombre de la tabla que necesites
      if (nivel !== null) {
        console.log("El último nivel obtenido es:", nivel);
      }
    } catch (error) {
      console.error(
        "Error al intentar obtener el último nivel:",
        error.message
      );
    }

    // Llamar a la función para insertar en la base de datos con los valores obtenidos, incluyendo nivel
    try {
      await insertarFlowSensorPt(flowRate_m3_h, calidad, nivel);
      console.log("Inserción de datos completada con éxito.");
    } catch (error) {
      console.error("Error al intentar insertar datos:", error.message);
    }
  } else {
    console.log("No se pudieron leer los registros necesarios.");
  }
}

// Configuración del cron job para que se ejecute cada 30 segundos
const job = new cron.CronJob("*/2 * * * *", () => {
  console.log("Ejecutando tarea programada cada 2 minutos");
  main(); // Llamada a la función principal
});

// Iniciar el cron job
job.start();
