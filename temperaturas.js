import ModbusRTU from "modbus-serial";

// Modbus server parameters
const plc_21 = "192.168.0.120";
const plc_1A = "192.168.7.10";
const plc_1B = "192.168.6.100";
const adam_22_1 = "192.168.0.47";
const adam_22_2 = "192.168.0.48";
const server_port = 502; // This likely needs to be adjusted for RTU over TCP

const division_factor_10 = 10;

function interpretAs16bitSigned(value) {
    if (value > 32767) {
        return value - 65536;
    }
    return value;
}

async function readAndDisplayModbusData(server_ip, server_name, retry_count = 5, retry_interval = 6) {
    console.log(`\nReading from ${server_name} (${server_ip}):`);
    console.log("-" * 50);

    const client = new ModbusRTU();
    let attempts = 0;

    while (attempts <= retry_count) {
        try {
            await client.connectTCP(server_ip, { port: server_port }); // Use connectTCP for Modbus RTU over TCP
            
            // PLC 21 readings
            if (server_ip === plc_21) {
                const registers = {
                    'DE': [1638, 'de_21'],
                    'NDE': [1639, 'nde_21'],
                    'Phase A1': [1640, 'fase1A_21'],
                    'Phase A2': [1643, 'faseA2_21'],
                    'Phase B1': [1641, 'faseB1_21'],
                    'Phase B2': [1644, 'faseB2_21'],
                    'Phase C1': [1642, 'faseC1_21'],
                    'Phase C2': [1645, 'faseC2_21']
                };

                for (const name in registers) {
                    const [register, _] = registers[name];
                    const result = await client.readHoldingRegisters(register, 1);
                    if (result) {
                        const value = interpretAs16bitSigned(result.data[0]);
                        console.log(`${name}: ${value}°C`);
                    }
                }
            }

            // PLC 1A readings
            else if (server_ip === plc_1A) {
                const result = await client.readHoldingRegisters(234, 1);
                if (result) {
                    const speed = result.data[0] / division_factor_10;
                    console.log(`Speed I1A: ${speed} RPM`);
                }
            }

            // PLC 1B readings
            else if (server_ip === plc_1B) {
                const result = await client.readInputRegisters(16, 1); // Use readInputRegisters for input registers
                if (result) {
                    const speed = result.data[0] / division_factor_10;
                    console.log(`Speed I1B: ${speed} RPM`);
                }
            }

            // ADAM 22_1 and 22_2 readings
            else if (server_ip === adam_22_1 || server_ip === adam_22_2) {
                for (let i = 1; i <= 5; i++) {
                    const result = await client.readHoldingRegisters(i, 1);
                    if (result) {
                        const temp = Math.round((result.data[0] / 65535) * (150 - (-50)) + (-50), 2);
                        console.log(`Channel ${i}: ${temp}°C`);
                    }
                }
            }

            client.close();
            return true;
        } catch (e) {
            console.error(`Error: ${e}`);
            attempts += 1;
            if (attempts <= retry_count) {
                console.log(`Attempt ${attempts}: Failed to connect`);
                await new Promise(resolve => setTimeout(resolve, retry_interval * 1000)); // Wait before retrying
            }
        }
    }

    return false;
}



async function main() {
    while (true) {
        const servers = [
            [plc_21, "PLC 21"],
            [plc_1A, "PLC 1A"],
            [plc_1B, "PLC 1B"],
            [adam_22_1, "ADAM 22-1"],
            [adam_22_2, "ADAM 22-2"]
        ];

        for (const [server_ip, server_name] of servers) {
            await readAndDisplayModbusData(server_ip, server_name);
        }

        console.log("\nWaiting 5 seconds before next reading...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}


main().catch(console.error); // Use .catch to handle any errors during execution


//To stop the script, press Ctrl+C in the terminal.