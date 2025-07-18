import { poolLecturas } from "../main_sql_local/database.js";
import cron from "cron";

import { readHoldingRegisters, readCoils } from "./src/functions/modbusRead.js";

// Función principal que lee los datos y los inserta en la base de datos
async function main() {
  const ip = "192.168.7.10";
  const port = 502;
  const slaveId = 1;

  try {
    // Leer el estado de la bomba (coil 2)
    const bombaEstado = await readCoils(ip, port, slaveId, 1);
    const estado = bombaEstado[0] ? 1 : 0;
    console.log("Estado de Bomba:", estado);

    // Leer el estado del deflector (coil 50)
    const estadoDeflector = await readCoils(ip, port, slaveId, 50);
    const estadoDeflectorValor = estadoDeflector[0] ? "AUTO" : "MANUAL";
    console.log("Estado del Deflector:", estadoDeflectorValor);

    // Leer el valor de kW (holding register 307)
    const kW = await readHoldingRegisters(ip, port, slaveId, 307);
    console.log("kWatsTotal:", kW[0]);

    // Insertar en la base de datos
    const query = `
            INSERT INTO monitoreo1A (bomba, deflector, kw)
            VALUES (?, ?, ?)
        `;

    // Ejecutar la consulta para insertar los datos
    const [result] = await poolLecturas.execute(query, [
      estado,
      estadoDeflectorValor,
      kW[0],
    ]);
    console.log("Datos insertados en la base de datos con éxito:", result);
  } catch (error) {
    console.error("Error en la ejecución:", error);
  }
}

// Configuración del cron job para que se ejecute cada 30 segundos
const job = new cron.CronJob("*/1 * * * * *", () => {
  console.log("Ejecutando tarea programada cada 30 segundos");
  main(); // Llamada a la función principal
});

// Iniciar el cron job
job.start();

console.log("Tarea programada iniciada, insertando datos cada 30 segundos");
