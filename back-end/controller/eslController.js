const esl = require('modesl');
require('dotenv').config();
var log = require('log4js').getLogger("ESL Connection");
exports.stationMonitorLive = async (req, res) => {
    
    const wsUrl = process.env.WSURL
    await initESLConnection()
    const { uuid, adminUserId } = req.body;
    
    if (!uuid || !wsUrl) {
        return res.status(400).json({ message: 'UUID and WebSocket URL are required' });
    }

    try {
        // Execute the audio fork commandp
        const result = await executeAudioForkCommand(uuid, wsUrl);

        res.status(200).json({ message: result });
    } catch (error) {
        log.error(error)
        res.status(500).json({ message: 'Error executing audio fork', error });
    }

    async function executeAudioForkCommand(uuid, audioForkUrl) {
        return new Promise((resolve, reject) => {
            try {
                // Check if connection is available and ready
                if (!connection) {
                    return reject('ESL connection is not established');
                }

                // Create the audio_fork command
                const command = `uuid_audio_fork ${uuid} start ${audioForkUrl} mixed 8000 '{"userId":"${adminUserId}","uuid":"${uuid}"}'`;
                console.log(command, 'comand');


                // Execute the command
                connection.api(command, (response) => {
                    console.log('Response:', response);

                    resolve(response.getBody());
                });
            } catch (error) {
                log.error(error)

            }

        });
    }
    function initESLConnection() {
        try {
            const host = process.env.LIVEHOST; // Replace with your FreeSWITCH IP
            const port = process.env.LIVEPORT; // Default ESL port
            const password = process.env.WEBSOCKETPASSWORD; // Default ESL password

            return new Promise((resolve, reject) => {
                connection = new esl.Connection(host, port, password);

                connection.on('error', (error) => {
                    console.error('Connection error:', error);
                    reject(error);
                });

                connection.on('esl::ready', () => {

                    resolve(connection);
                });
            });
        } catch (error) {
            log.error(error)

        }

    }
}
exports.stopLive = async (req, res) => {
    const { uuid } = req.body;

    if (!uuid) {
        return res.status(400).json({ message: 'UUID is required.' });
    }

    try {
        // Ensure ESL connection is initialized
        if (!connection) {
            await initESLConnection();
        }

        const result = await executeAudioForkStopCommand(uuid);
        res.status(200).json({ message: 'Audio fork stopped successfully', result });
    } catch (error) {
        console.error('Error in stopLive:', error);
        log.error(error)
        res.status(500).json({ message: 'Error stopping audio fork', error });
    }
    async function executeAudioForkStopCommand(uuid,) {
        return new Promise((resolve, reject) => {
            // Check if connection is available and ready
            if (!connection) {
                return reject('ESL connection is not established');
            }

            // Create the stop command
            const command = `uuid_audio_fork ${uuid} stop`;

            // Execute the command
            connection.api(command, (response) => {
               

                // Resolve the promise with the response
                resolve(response.getBody());
            });
        });
    }
    function initESLConnection() {
        try {
            const host = process.env.LIVEHOST; // Replace with your FreeSWITCH IP
            const port = process.env.LIVEPORT; // Default ESL port
            const password = process.env.WEBSOCKETPASSWORD; // Default ESL password

            return new Promise((resolve, reject) => {
                connection = new esl.Connection(host, port, password);

                connection.on('error', (error) => {
                    console.error('Connection error:', error);
                    log.error(error)
                    reject(error);
                });

                connection.on('esl::ready', () => {
                    console.log('Connected to FreeSWITCH via ESL.');
                    resolve(connection);
                });
            });
        } catch (error) {
            log.error(error)
        }

    }

};
