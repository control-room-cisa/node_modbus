import moment from "moment-timezone";
import { poolLecturas } from "../main_sql_local/database.js";
import cron from "cron";

// Función para obtener los últimos 15 registros
async function obtenerUltimosRegistros() {
  try {
    const query = `SELECT * FROM generacion ORDER BY fecha DESC LIMIT 15`;
    const [result] = await poolLecturas.query(query);
    return result.reverse(); // Invertimos el orden para trabajar del más antiguo al más reciente
  } catch (error) {
    console.error("Error al obtener los últimos registros:", error.message);
    return [];
  }
}

// Función para obtener el minuto actual
function obtenerMinutoActual() {
  const zonaHoraria = "America/Tegucigalpa";
  const minutoActual = moment().tz(zonaHoraria).startOf("minute").format("YYYY-MM-DD HH:mm:ss");
  console.log(`Minuto actual generado: ${minutoActual}`);
  return minutoActual;
}

// Función para calcular el promedio de los valores entre dos registros
function calcularPromedio(registroA, registroB) {
  const zonaHoraria = "America/Tegucigalpa";
  const fechaA = moment(registroA.fecha).tz(zonaHoraria);
  const nuevaFecha = fechaA.add(1, "minute"); // Sumamos 1 minuto

  return {
    id: registroA.id + 1, // ID será el anterior + 1
    fecha: nuevaFecha.format("YYYY-MM-DD HH:mm:ss"), // Formato compatible con MySQL
    kw22: (registroA.kw22 + registroB.kw22) / 2,
    kvar22: (registroA.kvar22 + registroB.kvar22) / 2,
    kw21: (registroA.kw21 + registroB.kw21) / 2,
    kvar21: (registroA.kvar21 + registroB.kvar21) / 2,
    kw1A: (registroA.kw1A + registroB.kw1A) / 2,
    kw1B: (registroA.kw1B + registroB.kw1B) / 2,
    voltage: (registroA.voltage + registroB.voltage) / 2,
  };
}

// Función para insertar un nuevo registro
async function insertarRegistroPromedio(nuevoRegistro) {
  try {
    const query = `INSERT INTO generacion (id, fecha, kw22, kvar22, kw21, kvar21, kw1A, kw1B, voltage) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await poolLecturas.query(query, [
      nuevoRegistro.id,
      nuevoRegistro.fecha,
      nuevoRegistro.kw22,
      nuevoRegistro.kvar22,
      nuevoRegistro.kw21,
      nuevoRegistro.kvar21,
      nuevoRegistro.kw1A,
      nuevoRegistro.kw1B,
      nuevoRegistro.voltage,
    ]);
    console.log(`Registro faltante insertado: ${JSON.stringify(nuevoRegistro)}`);
  } catch (error) {
    console.error("Error al insertar el registro promedio:", error.message);
  }
}

// Función principal para buscar y rellenar minutos faltantes
async function rellenarMinutosFaltantes() {
  try {
    const registros = await obtenerUltimosRegistros();

    for (let i = 0; i < registros.length - 1; i++) {
      const registroActual = registros[i];
      const registroSiguiente = registros[i + 1];

      const fechaActual = moment(registroActual.fecha).tz("America/Tegucigalpa");
      const fechaSiguiente = moment(registroSiguiente.fecha).tz("America/Tegucigalpa");

      // Verificar si falta un minuto entre los dos registros
      const diferenciaMinutos = fechaSiguiente.diff(fechaActual, "minutes");
      if (diferenciaMinutos > 1) {
        console.log(
          `Falta un minuto entre ${registroActual.fecha} y ${registroSiguiente.fecha}`
        );

        // Calcular el promedio y crear un nuevo registro
        const nuevoRegistro = calcularPromedio(
          registroActual,
          registroSiguiente
        );

        // Insertar el nuevo registro en la base de datos
        await insertarRegistroPromedio(nuevoRegistro);
      }
    }
  } catch (error) {
    console.error(
      "Error en el proceso de rellenar minutos faltantes:",
      error.message
    );
  }
}

// Configuración del cron para ejecutarse cada 5 minutos
const job = new cron.CronJob("0 */5 * * * *", () => {
  rellenarMinutosFaltantes();
});

job.start();

console.log(
  "Tarea para rellenar minutos faltantes configurada para ejecutarse cada 5 minutos."
);
