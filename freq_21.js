import cron from 'cron';
import { poolLecturas } from "../main_sql_local/database.js";
import { readSignedHoldingRegister } from "./src/functions/modbusRead.js";

async function main() {
  const ip = "192.168.0.120";
  const port = 502;
  const slaveId = 1;
  const registerFrecuencia = 1637;

  let frecuencia = null;

  try {
    frecuencia = await readSignedHoldingRegister(
      ip,
      port,
      slaveId,
      registerFrecuencia
    );

    if (frecuencia !== null) {
      // Dividir la frecuencia por 100 para convertir de 6000 a 60.00
      const frecuenciaAjustada = frecuencia / 100;

      console.log(`Frecuencia leída del registro ${registerFrecuencia}:`, frecuencia);
      console.log(`Frecuencia ajustada (dividida por 100):`, frecuenciaAjustada);

      try {
        const query = "INSERT INTO frecuencia_generador21 (frecuencia) VALUES (?)";
        const [result] = await poolLecturas.query(query, [frecuenciaAjustada]);

        console.log(
          `Frecuencia insertada en la tabla frecuencia_generador21. ID de inserción: ${result.insertId} - Fecha: ${new Date()}`
        );
      } catch (error) {
        console.error(
          "Error al insertar la frecuencia en la base de datos:",
          error.message
        );
      }
    } else {
      console.log(
        `No se pudo leer la frecuencia del registro ${registerFrecuencia}. Valor recibido: null - Fecha: ${new Date()}`
      );
    }
  } catch (error) {
    console.error("Error al leer la frecuencia desde Modbus:", error.message);
  }
  // No cerramos poolLecturas aquí, ya que el script seguirá corriendo con el cron job
  // finally {
  //   poolLecturas.end();
  // }
}

// Configuración del cron job para ejecutar 'main' cada minuto
const job = new cron.CronJob('* * * * *', () => {
  console.log('Ejecutando lectura de frecuencia según cron job - Fecha:', new Date());
  main();
});

// Iniciar el cron job
job.start();

console.log('Cron job para lectura de frecuencia iniciado. Ejecutando cada minuto.');