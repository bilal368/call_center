const CryptoJS = require('crypto-js');
let log = require("log4js").getLogger("Home");
const { LicenceKey } = require('../model/licenseKey');
const pako = require('pako');
const apiSecret = process.env.AUTHORIZATION_USER
const jwt = require('jsonwebtoken');
const os = require('os');
const { ldap } = require('../model/ldap');
const bcrypt = require('bcrypt');
const redisClient = require('../redisconnection');
// Validate License Key
exports.fetchLicenceKey = async (req, res) => {
    try {
        log.info('fetchLicenseKey');
        const [Token] = await LicenceKey.fetchLicenseKey();
        if (Token.length === 0) {
            Token.status = false
            return res.status(404).json({ status: false, tokenDetails: Token });
        }
        res.status(200).json({ status: true, tokenDetails: Token });

    } catch (err) {
        log.error(err);
        console.error(err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
// Insert Lincense Key
exports.insertLicenseKey = async (req, res) => {
    try {
        log.info('insertLicenseKey');
        const { token, internalFeatures, serialKey, amc } = req.body;
        const insertToken = await LicenceKey.updateLicenseKey(token, internalFeatures, serialKey, amc);
        if (insertToken.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "License Key is not inserted" });
        }
        res.status(200).json({ status: true, tokenDetails: token });
    } catch (err) {
        log.error(err);
        console.error(err);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
// Decrpyt License Key
exports.validateLicenseKey = async (req, res) => {
    try {
        log.info('Executing decryption API');
        // Decrypt the token
        const token = req.body.token;
        const receivedEncryptedData = token;
        // Hash the key to ensure it is the correct length
        const hashedKey = CryptoJS.SHA256(apiSecret).toString(CryptoJS.enc.Hex).slice(0, 32);
        console.log("Hashed Key:", hashedKey);
        // Step 1: Decrypt the encrypted data
        const decrypted = CryptoJS.AES.decrypt(receivedEncryptedData, CryptoJS.enc.Hex.parse(hashedKey), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        // Step 2: Convert decrypted data from WordArray to Base64 string
        const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
        // Step 3: Convert Base64 string to Uint8Array
        const byteCharacters = atob(decryptedBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Step 4: Decompress the data using pako
        const decompressedData = pako.inflate(byteArray, { to: 'string' });
        const decryptedData = decompressedData;

        const receivedToken = decompressedData;
        const lastDotIndex = decryptedData.lastIndexOf('.');
        const parts = receivedToken.split('.');
        const MacAddress = parts[parts.length - 1];
        const cleanedData = decryptedData.substring(0, lastDotIndex);

        // Verify the JWT
        jwt.verify(cleanedData, apiSecret, (err, decoded) => {
            if (err) {
                console.error('JWT verification failed:', err.message);
                return res.status(401).json({ status: false, message: "Invalid Token ID" });
            } else {
                // const normalizedInputMac = MacAddress;
                const normalizedInputMac = normalizeMacAddress(MacAddress);

                const macAddresses = getAllMacAddresses();

                let matchedMac = false;

                console.log("Fetch All macAddresses", macAddresses)
                console.log("License macAddress", normalizedInputMac)

                macAddresses.forEach((item) => {
                    const normalizedSystemMac = normalizeMacAddress(item.macAddress);
                    if (normalizedInputMac === normalizedSystemMac) {
                        matchedMac = true;
                    }
                });
                if (matchedMac) {
                    console.log('MAC Address match found:', MacAddress);
                    // Encrypt the password
                    const hashedPassword = bcrypt.hash('powerUser@#$', 10);
                    const resp = ldap.createStaticUser();
                    return res.status(200).json({ status: true, message: `MAC Address:${MacAddress} validated successfully.`, decoded });
                } else {
                    console.log('MAC Address match not found');
                    return res.status(403).json({ status: false, message: 'MAC Address validation failed.' });
                }
            }
        });
    } catch (outerError) {
        log.error(outerError);
        console.error("Error decrypting license:", outerError);
        return res.status(500).json({ status: false, message: "Invalid Token ID" });
    }
}
exports.fetchToken = async (req, res) => {
    try {
        const token = await LicenceKey.fetchLicenseKeyActive();
        const exists = await redisClient.exists('TOTAL_ACTIVE_CHANNELS');
        const totalActiveChannels = await redisClient.hgetall('TOTAL_ACTIVE_CHANNELS');
        
        const result = await validateLicenseKey(token);
        res.status(200).json({ status: true, result: result,totalNumberChannels:totalActiveChannels.IPCH });
    } catch (error) {
        console.log(error);
        log.error(error)
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

async function validateLicenseKey(token1) {
    return new Promise((resolve, reject) => {
        try {
            if (!token1 || !token1[0] || !token1[0][0] || !token1[0][0].token) {
                console.error("Invalid token structure");
                return resolve(null);
            }

            const receivedEncryptedData = token1[0][0].token;

            // Hash the key to ensure it is the correct length
            const hashedKey = CryptoJS.SHA256(apiSecret).toString(CryptoJS.enc.Hex).slice(0, 32);

            // Step 1: Decrypt the encrypted data
            const decrypted = CryptoJS.AES.decrypt(receivedEncryptedData, CryptoJS.enc.Hex.parse(hashedKey), {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });

            // Step 2: Convert decrypted data from WordArray to Base64 string
            const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedBase64) {
                console.error("Decryption failed");
                return resolve(null);
            }

            // Step 3: Convert Base64 string to Uint8Array
            const byteCharacters = atob(decryptedBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Step 4: Decompress the data using pako
            const decompressedData = pako.inflate(byteArray, { to: "string" });
            if (!decompressedData) {
                console.error("Decompression failed");
                return resolve(null);
            }

            const decryptedData = decompressedData;

            const lastDotIndex = decryptedData.lastIndexOf(".");
            if (lastDotIndex === -1) {
                console.error("Invalid token format");
                return resolve(null);
            }

            const cleanedData = decryptedData.substring(0, lastDotIndex);

            // Step 5: Verify the JWT
            jwt.verify(cleanedData, apiSecret, (err, decoded) => {
                if (err) {
                    console.error("JWT verification failed:", err.message);
                    return resolve(null);
                }
                return resolve(decoded);
            });
        } catch (error) {
            console.error("Error decrypting license:", error);
            return resolve(null);
        }
    });
}
function getAllMacAddresses() {
    const networkInterfaces = os.networkInterfaces();
    const macAddresses = [];

    Object.keys(networkInterfaces).forEach((interfaceName) => {
        // This set ensures that we don’t add duplicate MAC addresses
        const macSet = new Set();

        networkInterfaces[interfaceName].forEach((iface) => {
            // Filter out internal and empty MAC addresses
            if (!iface.internal && iface.mac !== '00:00:00:00:00:00' && iface.mac) {
                // Only add unique MAC addresses for each interface
                if (!macSet.has(iface.mac)) {
                    macAddresses.push({
                        interfaceName,
                        macAddress: iface.mac
                    });
                    macSet.add(iface.mac);
                }
            }
        });
    });

    return macAddresses;
}
function normalizeMacAddress(mac) {
    return mac.toUpperCase().replace(/[:-]/g, '');
}
exports.fetchLicenseValidityCheck = async (req, res) => {
    try {
        const license = await LicenceKey.getLicenseDate();
        log.info(license);
        return res.status(200).json({ status: true, statusText: "validity fetched successfully", license })
    } catch (error) {
        log.error(error);
        console.error(error)
        res.status(500).json({ error: 'Internal server error' });
    }
}
