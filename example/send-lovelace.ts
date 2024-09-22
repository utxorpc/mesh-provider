// Step #1
// Import Mesh SDK and UTxO RPC provider
import { Transaction, MeshWallet } from "@meshsdk/core";
import { U5CProvider } from "../src";

async function main() {

    // Step #2
    // Create a new U5C provider
    const provider = new U5CProvider({
        url: "http://localhost:50051",
        headers: {
            "dmtr-api-key": "<api-key>",
        },
    });

    // Step #3
    // Create a new wallet from a mnemonic
    const wallet = new MeshWallet({
    networkId: 0, // 0: testnet, 1: mainnet
    fetcher: provider,
    submitter: provider,
    key: {
        type: 'mnemonic',
        words: ["solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution","solution"],
    },
    });

    // Optional: Print the wallet address
    console.log(wallet.getChangeAddress())

    // Optional: Print the wallet utxos
    console.log(await provider.fetchAddressUTxOs(wallet.getChangeAddress()))

    // Step #4
    // Create an example transaction that sends 5 ADA to an address
    const tx = new Transaction({ initiator: wallet, verbose: false })
    .sendLovelace(
        'addr_test1vpvx0sacufuypa2k4sngk7q40zc5c4npl337uusdh64kv0c7e4cxr',
        '5000000'
    );
    const unsignedTx = await tx.build();

    // Step #5
    // Sign the transaction
    const signedTx = wallet.signTx(unsignedTx);

    // Step #6
    // Submit the transaction to the blockchain network
    const txId = await provider.submitTx(signedTx);

    // Optional: Print the transaction ID
    console.log("Transaction ID", txId);
}

main().catch(console.error);