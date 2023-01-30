const driver = require('bigchaindb-driver')
const base58 = require('bs58');
const crypto = require('crypto');
const { Ed25519Sha256 } = require('crypto-conditions');

const API_PATH = 'http://localhost:9984/api/v1/'
const conn = new driver.Connection(API_PATH);

const alice = new driver.Ed25519Keypair()
const bob = new driver.Ed25519Keypair()

const BigchainDB = {

    create: async function() {
        try {

            let nTokens = 100;

            const assetdata = {
                'car': {
                    'serial_number': Date.now(),
                    'manufacturer': 'XYZ Inc.',

                },
                number_tokens: nTokens
            }

            const metadata = { 'fuel_level': '75' }

            const assetCreateTx = driver.Transaction.makeCreateTransaction(
                assetdata,
                metadata,
                [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey), nTokens.toString())],
                alice.publicKey
            )

            const TxSigned = driver.Transaction.signTransaction(assetCreateTx, alice.privateKey)
            let createAsset = await conn.postTransactionCommit(TxSigned)
            return createAsset;

        } catch (error) {
            console.log('Error @ create :', error)
            return false;
        }
    },

    append: async function(id) {
        try {

            let getTXN = await conn.getTransaction(id);

            const new_metadata = {
                'fuel_level': '75',
                'colour': 'Blue',
                'that': 'is'
            }

            const txTransferBob = driver.Transaction.makeTransferTransaction(
                [{ tx: getTXN, output_index: 0 }],
                [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
                new_metadata,
            )

            const TxSigned = driver.Transaction.signTransaction(txTransferBob, bob.privateKey)
            let createAsset = await conn.postTransactionCommit(TxSigned)

        } catch (error) {
            console.log('Error @ append :', error)
            return false;
        }
    },

    transfer: async function(id) {
        try {

            let getTXN = await conn.getTransaction(id);
            let tokensLeft = 0;
            let amountToSend = 1;

            for (let output of getTXN.outputs) {
                if (output.public_keys[0] == alice.publicKey) {
                    tokensLeft = tokensLeft + +output.amount;
                }
            }

            if (tokensLeft > 1) {
                const txTransferBob = driver.Transaction.makeTransferTransaction(
                    [{ tx: getTXN, output_index: 0 }],
                    [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(alice.publicKey), (tokensLeft - amountToSend).toString()),
                        driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey), amountToSend.toString())
                    ],
                    getTXN.metadata
                )

                const TxSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)

                let transfer = await conn.postTransactionCommit(TxSigned)
            } else {

                const txTransferBob = driver.Transaction.makeTransferTransaction(
                    [{ tx: getTXN, output_index: 0 }],
                    [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(bob.publicKey))],
                    getTXN.metadata
                )

                const TxSigned = driver.Transaction.signTransaction(txTransferBob, alice.privateKey)

                let transfer = await conn.postTransactionCommit(TxSigned)
            }

        } catch (error) {
            console.log('Error @ transfer :', error)
            return false;
        }
    },

    burn: async function(id) {
        try {

            const BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn';

            let getTXN = await conn.getTransaction(id)

            const new_metadata = { 'status': 'Burned' }

            const txTransferBob = driver.Transaction.makeTransferTransaction(
                [{ tx: getTXN, output_index: 0 }],
                [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(BURN_ADDRESS))],
                new_metadata,
            )

            const TxSigned = driver.Transaction.signTransaction(txTransferBob, bob.privateKey)
            let burn = await conn.postTransactionCommit(TxSigned)

        } catch (error) {
            console.log('Error @ burn :', error)
            return false;
        }
    },

    getTXN: async function(id) {
        try {
            let getTXN = await conn.getTransaction(id)
        } catch (error) {
            console.log('Error @ burn :', error)
            return false;
        }
    }
}

module.exports = BigchainDB

// module.exports = BigchainDB.create()
// module.exports = BigchainDB.getTXN('cd16e671a3e0630ec5c82cdb8fdcd8889722a362eb1d21b0335de468ab6a2ce7')
// module.exports = BigchainDB.append('1c35a2b83acbb0ce629e338102de2894390f295c5f8acb3aa04b3f343a507669')
// module.exports = BigchainDB.burn('b4a7980276dc5d77f39f867d436a3c5612a3568107d372a91d3f55449097d503')
// module.exports = BigchainDB.transfer('d5835d67e09a12fd2f486972f0b5e91cd6cb54f4733e30d3037b80b4fe4dde64')