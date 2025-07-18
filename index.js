import {
  readHoldingRegisters,
  readCoils,
  read32BitHoldingRegister,
  readSignedHoldingRegister,
} from "./src/functions/modbusRead.js";

/*
PLC22: "192.168.0.130"
PLC21: "192.168.0.120"
PLC1A: "192.168.7.10"
PLC1B: "192.168.6.100"
*/

async function main() {
  const ip = "192.168.0.120";
  const port = 502;
  const slaveId = 1;

  // Read holding register 1631
 // const voltageData = await readHoldingRegisters(ip, port, slaveId, 1631);
 // console.log(`Voltage Data (Register 1631):`, voltageData * 10);

  // Read holding register 1636
  //const frequencyData = await readHoldingRegisters(ip, port, slaveId, 1636);
  //console.log(`Frequency Data (Register 1636):`, frequencyData / 100);

  //Read holding register 1423
  const kVarsTotal = await readSignedHoldingRegister(ip, port, slaveId, 1635);
  console.log(`kVarsTotal (Register 1423):`, kVarsTotal);

  // Read coil 322
  //const deadbusData = await readCoils(ip, port, slaveId, 322);
  //console.log(`Deadbus Data (Coil 322):`, deadbusData[0]);

  const lowRegister = 1415;
  const highRegister = 1414;

  const realKWDelivered = await read32BitHoldingRegister(
    ip,
    port,
    slaveId,
    lowRegister,
    highRegister
  );
  if (realKWDelivered !== null) {
    console.log(`Valor del registro 1414 y 1415 (32 bits): ${realKWDelivered}`);
  } else {
    console.log("No se pudo leer el valor de 32 bits.");
  }
}

main();
